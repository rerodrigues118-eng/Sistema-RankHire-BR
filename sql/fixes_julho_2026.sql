-- ============================================================
-- RankHire BR — Correções críticas — Julho 2026
-- Cole no Supabase SQL Editor e execute tudo
-- ============================================================

-- 1. FUNÇÃO SECURITY DEFINER (quebra recursão RLS)
-- Esta função roda com permissões elevadas e não dispara RLS,
-- quebrando o loop de recursão que causava "stack depth limit exceeded"
-- NOTA: Criada em schema PUBLIC, não em auth (Supabase não permite)

CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- 2. RECRIA TODAS AS POLICIES SEM RECURSÃO
-- Para cada tabela com empresa_id, usamos auth.get_empresa_id()
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- vagas
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "vagas_empresa_isolamento" ON public.vagas;
DROP POLICY IF EXISTS "vagas_insert_own" ON public.vagas;
DROP POLICY IF EXISTS "vagas_update_own" ON public.vagas;
DROP POLICY IF EXISTS "vagas_delete_own" ON public.vagas;

CREATE POLICY "vagas_select" ON public.vagas
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "vagas_insert" ON public.vagas
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "vagas_update" ON public.vagas
  FOR UPDATE USING (empresa_id = public.get_empresa_id());
CREATE POLICY "vagas_delete" ON public.vagas
  FOR DELETE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- criteria
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "criteria_empresa_isolamento" ON public.criteria;
DROP POLICY IF EXISTS "criteria_insert_own" ON public.criteria;
DROP POLICY IF EXISTS "criteria_update_own" ON public.criteria;
DROP POLICY IF EXISTS "criteria_delete_own" ON public.criteria;

CREATE POLICY "criteria_select" ON public.criteria
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "criteria_insert" ON public.criteria
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "criteria_update" ON public.criteria
  FOR UPDATE USING (empresa_id = public.get_empresa_id());
CREATE POLICY "criteria_delete" ON public.criteria
  FOR DELETE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- pdf_candidates
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pdf_candidates_empresa" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_insert" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_update" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_delete" ON public.pdf_candidates;

CREATE POLICY "pdf_candidates_select" ON public.pdf_candidates
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pdf_candidates_insert" ON public.pdf_candidates
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "pdf_candidates_update" ON public.pdf_candidates
  FOR UPDATE USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pdf_candidates_delete" ON public.pdf_candidates
  FOR DELETE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- pdf_batches
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pdf_batches_empresa" ON public.pdf_batches;
DROP POLICY IF EXISTS "pdf_batches_insert" ON public.pdf_batches;
DROP POLICY IF EXISTS "pdf_batches_update" ON public.pdf_batches;

CREATE POLICY "pdf_batches_select" ON public.pdf_batches
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pdf_batches_insert" ON public.pdf_batches
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "pdf_batches_update" ON public.pdf_batches
  FOR UPDATE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- pipeline_entries
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pipeline_empresa" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_insert" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_update" ON public.pipeline_entries;

CREATE POLICY "pipeline_entries_select" ON public.pipeline_entries
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pipeline_entries_insert" ON public.pipeline_entries
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "pipeline_entries_update" ON public.pipeline_entries
  FOR UPDATE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- agentes_ia
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "agentes_empresa" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_insert" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_update" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_delete" ON public.agentes_ia;

CREATE POLICY "agentes_select" ON public.agentes_ia
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "agentes_insert" ON public.agentes_ia
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "agentes_update" ON public.agentes_ia
  FOR UPDATE USING (empresa_id = public.get_empresa_id());
CREATE POLICY "agentes_delete" ON public.agentes_ia
  FOR DELETE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- linkedin_searches
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "linkedin_searches_empresa" ON public.linkedin_searches;
DROP POLICY IF EXISTS "linkedin_searches_insert" ON public.linkedin_searches;

CREATE POLICY "linkedin_searches_select" ON public.linkedin_searches
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "linkedin_searches_insert" ON public.linkedin_searches
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- perfis_vistos
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "perfis_vistos_empresa" ON public.perfis_vistos;
DROP POLICY IF EXISTS "perfis_vistos_insert" ON public.perfis_vistos;

CREATE POLICY "perfis_vistos_select" ON public.perfis_vistos
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "perfis_vistos_insert" ON public.perfis_vistos
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- etiquetas
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "etiquetas_empresa" ON public.etiquetas;
DROP POLICY IF EXISTS "etiquetas_insert" ON public.etiquetas;
DROP POLICY IF EXISTS "etiquetas_update" ON public.etiquetas;

CREATE POLICY "etiquetas_select" ON public.etiquetas
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "etiquetas_insert" ON public.etiquetas
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "etiquetas_update" ON public.etiquetas
  FOR UPDATE USING (empresa_id = public.get_empresa_id());

-- ──────────────────────────────────────────────────────────
-- usuarios: usuário vê apenas a si mesmo
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE USING (id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- empresas: usuário vê apenas a própria empresa
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "empresas_select_own" ON public.empresas;
DROP POLICY IF EXISTS "empresas_update_own" ON public.empresas;

CREATE POLICY "empresas_select" ON public.empresas
  FOR SELECT USING (id = public.get_empresa_id());
CREATE POLICY "empresas_update" ON public.empresas
  FOR UPDATE USING (id = public.get_empresa_id());

-- ============================================================
-- 3. ADICIONA COLUNAS FALTANTES
-- ============================================================

-- Colunas de créditos e limites para controle de trial
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS creditos_pdfs_usados int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creditos_buscas_usados int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_pdfs_mes int DEFAULT 15,
  ADD COLUMN IF NOT EXISTS limite_buscas_linkedin int DEFAULT 3;

-- Coluna para armazenar critérios gerados pela IA (jsonb)
ALTER TABLE public.agentes_ia
  ADD COLUMN IF NOT EXISTS criterios_ia jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- 4. CORRIGE CONTAS TRIAL QUE ESTÃO COMO PRO
-- ============================================================

-- Identifica contas que foram criadas recentemente mas estão como PRO
-- Sem pagamento registrado → deve ser trial
UPDATE public.empresas
SET
  plano = 'trial',
  subscription_status = 'trialing',
  limite_pdfs_mes = 15,
  limite_buscas_linkedin = 3,
  creditos_pdfs_usados = 0,
  creditos_buscas_usados = 0
WHERE
  (plano = 'pro' OR plano IS NULL)
  AND subscription_status IN ('trialing', NULL)
  AND (stripe_customer_id IS NULL OR stripe_customer_id = '')
  AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');

-- ============================================================
-- 5. VERIFICA O RESULTADO
-- ============================================================

SELECT
  id,
  nome,
  plano,
  subscription_status,
  limite_pdfs_mes,
  limite_buscas_linkedin,
  trial_expires_at,
  created_at
FROM public.empresas
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- FIM DAS CORREÇÕES
-- Execute o SELECT acima para confirmar que todas as contas
-- estão com plano='trial' quando não têm pagamento registrado
-- ============================================================
