-- ============================================================
-- RankHire BR — Hotfix Auditoria (Race Conditions + Hardening)
-- Execute após auditoria_completa_julho_2026.sql
-- ============================================================

-- ── F1. Advisory lock para upload-batch (previne TOCTOU) ──────────
-- Retorna true se a empresa ainda tem créditos disponíveis.
-- Usa pg_advisory_xact_lock para serializar requests da mesma empresa.
CREATE OR REPLACE FUNCTION public.reservar_creditos_upload(
  p_empresa_id uuid,
  p_quantidade integer,
  p_limite integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usados integer;
  v_disponiveis integer;
  v_permitidos integer;
BEGIN
  -- Advisory lock garante que apenas 1 request por empresa entra aqui
  PERFORM pg_advisory_xact_lock(hashtext('upload_quota_' || p_empresa_id::text));

  -- Conta PDFs do mês corrente
  SELECT COUNT(*)::integer INTO v_usados
  FROM public.pdf_candidates
  WHERE empresa_id = p_empresa_id
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month';

  v_disponiveis := GREATEST(0, p_limite - v_usados);
  v_permitidos := LEAST(p_quantidade, v_disponiveis);

  RETURN jsonb_build_object(
    'permitido', v_permitidos > 0,
    'usados', v_usados,
    'disponiveis', v_disponiveis,
    'permitidos', v_permitidos
  );
END;
$$;

COMMENT ON FUNCTION public.reservar_creditos_upload IS
  'Advisory lock + quota check atomic para prevenir race condition em upload-batch';

-- ── F2. Função para reset mensal de créditos (pg_cron) ──────────
-- Requer extensão pg_cron habilitada no Supabase
-- SELECT cron.schedule('reset-creditos-mensais', '0 0 1 * *',
--   $$UPDATE public.empresas SET creditos_pdfs_usados = 0, creditos_buscas_usados = 0$$
-- );

-- ── F3. Índice para performance da contagem mensal ──────────────
CREATE INDEX IF NOT EXISTS idx_pdf_candidates_empresa_created
  ON public.pdf_candidates (empresa_id, created_at);

CREATE INDEX IF NOT EXISTS idx_pdf_candidates_empresa_status
  ON public.pdf_candidates (empresa_id, status);

-- ── F4. Policy: service_role pode tudo em pdf_exports ──────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pdf_exports' AND policyname = 'service_role_all_pdf_exports'
  ) THEN
    CREATE POLICY service_role_all_pdf_exports ON public.pdf_exports
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- F5. Admin company → Plano Pro (tudo ilimitado)
-- Atualiza a empresa de qualquer usuário com role admin/superadmin
-- para plano "pro" com subscription ativo.
-- ════════════════════════════════════════════════════════════
UPDATE public.empresas
SET
  plano = 'pro',
  subscription_status = 'active',
  limite_pdfs_mes = 9999,
  limite_buscas_linkedin = 9999,
  trial_expires_at = NULL
WHERE id IN (
  SELECT DISTINCT empresa_id
  FROM public.usuarios
  WHERE LOWER(TRIM(role)) IN ('admin', 'superadmin')
    AND empresa_id IS NOT NULL
);

-- Verifica resultado
SELECT u.email, u.role, e.nome AS empresa, e.plano, e.subscription_status
FROM public.usuarios u
JOIN public.empresas e ON e.id = u.empresa_id
WHERE LOWER(TRIM(u.role)) IN ('admin', 'superadmin')
ORDER BY u.email;

-- ════════════════════════════════════════════════════════════
-- F6: CRIA TABELAS FALTANTES (agente_runs, agente_candidatos)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.agente_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid NOT NULL REFERENCES public.agentes_ia(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'rodando',
  perfis_analisados int DEFAULT 0,
  candidatos_encontrados int DEFAULT 0,
  candidatos_score_alto int DEFAULT 0,
  logs jsonb,
  executado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agente_runs_agente ON public.agente_runs(agente_id, executado_em DESC);

CREATE TABLE IF NOT EXISTS public.agente_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid NOT NULL REFERENCES public.agentes_ia(id) ON DELETE CASCADE,
  linkedin_url text,
  dados_perfil jsonb,
  score_final numeric(3,2),
  criterios_avaliacao jsonb,
  visto boolean DEFAULT false,
  status text DEFAULT 'novo',
  descoberto_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agente_candidatos_agente ON public.agente_candidatos(agente_id, descoberto_em DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agente_candidatos_linkedin ON public.agente_candidatos(agente_id, linkedin_url) WHERE linkedin_url IS NOT NULL;

-- RLS for agente_runs
ALTER TABLE public.agente_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agente_runs_select" ON public.agente_runs;
DROP POLICY IF EXISTS "agente_runs_insert" ON public.agente_runs;
DROP POLICY IF EXISTS "agente_runs_update" ON public.agente_runs;
CREATE POLICY "agente_runs_select" ON public.agente_runs FOR SELECT USING (true);
CREATE POLICY "agente_runs_insert" ON public.agente_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "agente_runs_update" ON public.agente_runs FOR UPDATE USING (true);

-- RLS for agente_candidatos
ALTER TABLE public.agente_candidatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agente_candidatos_select" ON public.agente_candidatos;
DROP POLICY IF EXISTS "agente_candidatos_insert" ON public.agente_candidatos;
DROP POLICY IF EXISTS "agente_candidatos_update" ON public.agente_candidatos;
CREATE POLICY "agente_candidatos_select" ON public.agente_candidatos FOR SELECT USING (true);
CREATE POLICY "agente_candidatos_insert" ON public.agente_candidatos FOR INSERT WITH CHECK (true);
CREATE POLICY "agente_candidatos_update" ON public.agente_candidatos FOR UPDATE USING (true);

-- ════════════════════════════════════════════════════════════
-- F7: CORRIGE PLANOS — Apenas superadmin tem Pro, resto é trial
-- ════════════════════════════════════════════════════════════

-- 1. Reseta todas as empresas que NÃO são do superadmin para trial
UPDATE public.empresas
SET
  plano = 'trial',
  subscription_status = 'trialing',
  limite_pdfs_mes = 15,
  limite_buscas_linkedin = 3,
  trial_expires_at = COALESCE(trial_expires_at, (NOW() + INTERVAL '14 days')::timestamptz)
WHERE id NOT IN (
  SELECT DISTINCT u.empresa_id
  FROM public.usuarios u
  WHERE LOWER(TRIM(u.email)) = 'delski.contato@gmail.com'
    AND u.empresa_id IS NOT NULL
);

-- 2. Garante que a empresa do superadmin esteja Pro
UPDATE public.empresas
SET
  plano = 'pro',
  subscription_status = 'active',
  limite_pdfs_mes = 9999,
  limite_buscas_linkedin = 9999,
  trial_expires_at = NULL
WHERE id IN (
  SELECT DISTINCT u.empresa_id
  FROM public.usuarios u
  WHERE LOWER(TRIM(u.email)) = 'delski.contato@gmail.com'
    AND u.empresa_id IS NOT NULL
);

-- Verifica resultado final
SELECT u.email, u.role, e.nome AS empresa, e.plano, e.subscription_status
FROM public.usuarios u
JOIN public.empresas e ON e.id = u.empresa_id
ORDER BY
  CASE WHEN LOWER(TRIM(u.email)) = 'delski.contato@gmail.com' THEN 0 ELSE 1 END,
  u.email;

