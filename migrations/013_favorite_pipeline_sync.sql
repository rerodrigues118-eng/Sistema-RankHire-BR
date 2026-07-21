-- ============================================================
-- 013_favorite_pipeline_sync.sql
-- Sincroniza favoritos (shortlist) com o CRM e Pipeline.
-- Ao favoritar um candidato no PDF Ranker, ele é salvo no
-- pipeline_entries e passa a aparecer nas páginas de gestão.
-- ============================================================

-- 1. Garante a coluna de favoritos na tabela de candidatos
ALTER TABLE public.pdf_candidates
  ADD COLUMN IF NOT EXISTS shortlist boolean DEFAULT false;

-- Índice para filtros rápidos por favoritos
CREATE INDEX IF NOT EXISTS idx_candidates_shortlist
  ON public.pdf_candidates(empresa_id, shortlist)
  WHERE shortlist = true;

-- 2. Garante a tabela de pipeline_entries com as colunas necessárias
CREATE TABLE IF NOT EXISTS public.pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES pdf_candidates(id),
  vaga_id uuid REFERENCES vagas(id),
  empresa_id uuid REFERENCES empresas(id),
  status text DEFAULT 'triado',
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pipeline_entries
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES pdf_candidates(id),
  ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id),
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'triado',
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_pipeline_candidate
  ON public.pipeline_entries(candidate_id);

-- 3. Políticas RLS para pipeline_entries
ALTER TABLE public.pipeline_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_entries_select" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_insert" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_update" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_delete" ON public.pipeline_entries;

CREATE POLICY "pipeline_entries_select" ON public.pipeline_entries
  FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pipeline_entries_insert" ON public.pipeline_entries
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());
CREATE POLICY "pipeline_entries_update" ON public.pipeline_entries
  FOR UPDATE USING (empresa_id = public.get_empresa_id());
CREATE POLICY "pipeline_entries_delete" ON public.pipeline_entries
  FOR DELETE USING (empresa_id = public.get_empresa_id());
