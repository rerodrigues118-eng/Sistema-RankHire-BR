-- ============================================================
-- RankHire BR — Auditoria Completa + Novas Funcionalidades
-- Julho 2026 — Cole no Supabase SQL Editor e execute tudo
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- FASE 0 — FUNÇÕES E ÍNDICES
-- ════════════════════════════════════════════════════════════

-- 0.1 Função get_empresa_id (Security Definer — quebra recursão RLS)
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT empresa_id FROM public.usuarios
  WHERE id = auth.uid() LIMIT 1;
$$;

-- 0.2 Função incrementar_batch_processado
CREATE OR REPLACE FUNCTION public.incrementar_batch_processado(p_candidate_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_batch_id uuid;
BEGIN
  SELECT batch_id INTO v_batch_id FROM pdf_candidates WHERE id = p_candidate_id;
  IF v_batch_id IS NOT NULL THEN
    UPDATE pdf_batches SET
      processed_files = processed_files + 1,
      status = CASE WHEN processed_files + 1 >= total_files THEN 'concluido' ELSE 'processando' END
    WHERE id = v_batch_id;
  END IF;
END; $$;

-- 0.3 Função incrementar_creditos_pdf
CREATE OR REPLACE FUNCTION public.incrementar_creditos_pdf(p_empresa_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE empresas SET creditos_pdfs_usados = creditos_pdfs_usados + 1
  WHERE id = p_empresa_id;
END; $$;

-- 0.4 Função incrementar_creditos_busca
CREATE OR REPLACE FUNCTION public.incrementar_creditos_busca(p_empresa_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE empresas SET creditos_buscas_usados = creditos_buscas_usados + 1
  WHERE id = p_empresa_id;
END; $$;

-- ════════════════════════════════════════════════════════════
-- 0.5 ÍNDICES DE PERFORMANCE
-- ════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_vagas_empresa ON public.vagas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_candidates_empresa ON public.pdf_candidates(empresa_id);
CREATE INDEX IF NOT EXISTS idx_candidates_vaga ON public.pdf_candidates(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON public.pdf_candidates(empresa_id, score_final DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_candidates_batch ON public.pdf_candidates(batch_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.pdf_candidates(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_empresa ON public.pipeline_entries(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_vaga_status ON public.pipeline_entries(vaga_id, status);
CREATE INDEX IF NOT EXISTS idx_agentes_empresa ON public.agentes_ia(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_empresa ON public.admin_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_searches_empresa ON public.linkedin_searches(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_criteria_vaga ON public.criteria(vaga_id);

-- ════════════════════════════════════════════════════════════
-- FASE 1 — COLUNAS FALTANTES
-- ════════════════════════════════════════════════════════════

-- Empresas: colunas de controle de plano e créditos
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS creditos_pdfs_usados int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creditos_buscas_usados int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_pdfs_mes int DEFAULT 15,
  ADD COLUMN IF NOT EXISTS limite_buscas_linkedin int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS mrr_centavos int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS motivo_suspensao text,
  ADD COLUMN IF NOT EXISTS notas_internas text,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz;

-- Agentes IA: critérios em JSON
ALTER TABLE public.agentes_ia
  ADD COLUMN IF NOT EXISTS criterios_ia jsonb DEFAULT '[]'::jsonb;

-- PDF Candidates: colunas extras
ALTER TABLE public.pdf_candidates
  ADD COLUMN IF NOT EXISTS cargo_atual text,
  ADD COLUMN IF NOT EXISTS empresa_atual text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS email_contato text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS pretensao_salarial text,
  ADD COLUMN IF NOT EXISTS disponibilidade text,
  ADD COLUMN IF NOT EXISTS regime_preferido text,
  ADD COLUMN IF NOT EXISTS resumo_ia text,
  ADD COLUMN IF NOT EXISTS storage_path text;

-- ════════════════════════════════════════════════════════════
-- FASE 2 — TABELA linkedin_profiles (banco de perfis)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_url text UNIQUE NOT NULL,
  nome text,
  cargo_atual text,
  empresa_atual text,
  cidade text,
  skills jsonb DEFAULT '[]',
  idiomas jsonb DEFAULT '[]',
  formacao jsonb DEFAULT '[]',
  experiencias jsonb DEFAULT '[]',
  sobre text,
  anos_experiencia int,
  dados_completos jsonb,
  ultima_atualizacao timestamptz DEFAULT now(),
  fonte text DEFAULT 'apify',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_read" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "lp_write" ON public.linkedin_profiles;

CREATE POLICY "lp_read" ON public.linkedin_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "lp_write" ON public.linkedin_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_url ON public.linkedin_profiles(linkedin_url);

-- ════════════════════════════════════════════════════════════
-- FASE 3 — TABELA linkedin_search_sessions (se não existir)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.linkedin_search_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  vaga_id uuid,
  criado_por uuid REFERENCES auth.users(id),
  descricao_livre text,
  criterios jsonb DEFAULT '[]',
  filtros_aplicados jsonb DEFAULT '{}',
  total_resultados int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.linkedin_search_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lss_select" ON public.linkedin_search_sessions;
DROP POLICY IF EXISTS "lss_insert" ON public.linkedin_search_sessions;

CREATE POLICY "lss_select" ON public.linkedin_search_sessions
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "lss_insert" ON public.linkedin_search_sessions
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());

-- ════════════════════════════════════════════════════════════
-- FASE 4 — RLS ATIVO EM TODAS AS TABELAS
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_vistos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- FASE 5 — CORRIGE CONTAS TRIAL
-- ════════════════════════════════════════════════════════════

UPDATE public.empresas SET
  plano = 'trial',
  subscription_status = 'trialing',
  limite_pdfs_mes = 15,
  limite_buscas_linkedin = 3,
  creditos_pdfs_usados = COALESCE(creditos_pdfs_usados, 0),
  creditos_buscas_usados = COALESCE(creditos_buscas_usados, 0)
WHERE
  (stripe_customer_id IS NULL OR stripe_customer_id = '')
  AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '')
  AND subscription_status != 'active';

-- Ajusta limites por plano para contas existentes
UPDATE public.empresas SET
  limite_pdfs_mes = CASE plano
    WHEN 'trial'    THEN 15
    WHEN 'starter'  THEN 100
    WHEN 'pro'      THEN 500
    WHEN 'agencia'  THEN 9999
    ELSE 15 END,
  limite_buscas_linkedin = CASE plano
    WHEN 'trial'    THEN 3
    WHEN 'starter'  THEN 50
    WHEN 'pro'      THEN 200
    WHEN 'agencia'  THEN 9999
    ELSE 3 END
WHERE limite_pdfs_mes IS NULL OR limite_pdfs_mes = 0;

-- ════════════════════════════════════════════════════════════
-- FASE 6 — STORAGE BUCKETS (execute manualmente se precisar)
-- ════════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('curriculos', 'curriculos', false, 10485760, ARRAY['application/pdf']),
--   ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
-- ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- FASE 7 — VERIFICAÇÃO FINAL
-- ════════════════════════════════════════════════════════════

SELECT
  t.tablename,
  t.rowsecurity AS rls_ativo,
  COUNT(p.policyname) AS total_policies
FROM pg_tables t
LEFT JOIN pg_policies p
  ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

SELECT id, nome, plano, subscription_status,
  limite_pdfs_mes, creditos_pdfs_usados,
  limite_buscas_linkedin, creditos_buscas_usados,
  trial_expires_at
FROM public.empresas
ORDER BY created_at DESC;
