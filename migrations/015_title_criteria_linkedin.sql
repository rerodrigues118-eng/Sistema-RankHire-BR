-- 015_title_criteria_linkedin.sql
-- Add English vacancy title support, company-scoped criteria, and LinkedIn profile cache table.

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.criteria
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id),
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS weight int;

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
