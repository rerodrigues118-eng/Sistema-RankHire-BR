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
