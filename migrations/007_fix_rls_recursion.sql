-- ======================================================================
-- MIGRATION: 007_fix_rls_recursion.sql
-- Correção de recursão infinita RLS, adição da coluna 'shortlist' e simplificação de políticas
-- ======================================================================

-- 1. Adicionar coluna 'shortlist' na tabela 'pdf_candidates' se não existir
ALTER TABLE public.pdf_candidates ADD COLUMN IF NOT EXISTS shortlist boolean DEFAULT false;

-- 2. Criar a função SECURITY DEFINER para buscar o empresa_id sem RLS (Bypassa a recursão)
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- 3. Corrigir a política da tabela 'usuarios'
DROP POLICY IF EXISTS "Ver usuarios da mesma empresa" ON public.usuarios;
CREATE POLICY "Ver usuarios da mesma empresa" 
  ON public.usuarios 
  FOR SELECT 
  USING (
    id = auth.uid() 
    OR 
    empresa_id = public.get_user_empresa_id()
  );

-- 4. Simplificar e otimizar as políticas das demais tabelas (Evita lentidão)
DROP POLICY IF EXISTS "Acesso as vagas da empresa" ON public.vagas;
CREATE POLICY "Acesso as vagas da empresa" 
  ON public.vagas 
  FOR ALL 
  USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "Acesso criteria da empresa" ON public.criteria;
CREATE POLICY "Acesso criteria da empresa" 
  ON public.criteria 
  FOR ALL 
  USING (vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id = public.get_user_empresa_id()));

DROP POLICY IF EXISTS "Acesso pdf_batches da empresa" ON public.pdf_batches;
CREATE POLICY "Acesso pdf_batches da empresa" 
  ON public.pdf_batches 
  FOR ALL 
  USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "Acesso pdf_candidates da empresa" ON public.pdf_candidates;
CREATE POLICY "Acesso pdf_candidates da empresa" 
  ON public.pdf_candidates 
  FOR ALL 
  USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "Acesso evaluations da empresa" ON public.candidate_evaluations;
CREATE POLICY "Acesso evaluations da empresa" 
  ON public.candidate_evaluations 
  FOR ALL 
  USING (candidate_id IN (SELECT id FROM public.pdf_candidates WHERE empresa_id = public.get_user_empresa_id()));

DROP POLICY IF EXISTS "Acesso pipeline_entries da empresa" ON public.pipeline_entries;
CREATE POLICY "Acesso pipeline_entries da empresa" 
  ON public.pipeline_entries 
  FOR ALL 
  USING (empresa_id = public.get_user_empresa_id());

DROP POLICY IF EXISTS "Acesso pipeline_history da empresa" ON public.pipeline_history;
CREATE POLICY "Acesso pipeline_history da empresa" 
  ON public.pipeline_history 
  FOR ALL 
  USING (entry_id IN (SELECT id FROM public.pipeline_entries WHERE empresa_id = public.get_user_empresa_id()));

DROP POLICY IF EXISTS "Acesso linkedin_searches da empresa" ON public.linkedin_searches;
CREATE POLICY "Acesso linkedin_searches da empresa" 
  ON public.linkedin_searches 
  FOR ALL 
  USING (empresa_id = public.get_user_empresa_id());
