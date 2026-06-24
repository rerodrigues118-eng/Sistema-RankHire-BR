-- ==========================================
-- 1. CRIAÇÃO DE TABELAS E COLUNAS
-- ==========================================

-- 1. EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  cnpj text,
  segmento text,
  tamanho text,
  plano text DEFAULT 'trial_starter',
  trial_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS segmento text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tamanho text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plano text DEFAULT 'trial_starter';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 2. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  empresa_id uuid REFERENCES empresas(id),
  nome text,
  email text,
  cargo text,
  avatar_url text,
  role text DEFAULT 'recruiter',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'recruiter';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 3. VAGAS
CREATE TABLE IF NOT EXISTS vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id),
  criado_por uuid REFERENCES usuarios(id),
  titulo text,
  area text,
  tipo_contrato text,
  localizacao text,
  briefing text,
  status text DEFAULT 'ativa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vagas ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES usuarios(id);
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS tipo_contrato text;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS briefing text;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativa';
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- 4. CRITERIA
CREATE TABLE IF NOT EXISTS criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid REFERENCES vagas(id),
  nome text,
  peso int CHECK (peso BETWEEN 1 AND 5),
  gerado_por_ia boolean,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE criteria ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id);
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS peso int;
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS gerado_por_ia boolean;
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 5. PDF_BATCHES
CREATE TABLE IF NOT EXISTS pdf_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid REFERENCES vagas(id),
  empresa_id uuid REFERENCES empresas(id),
  total_files int,
  processed_files int DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id);
ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS total_files int;
ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS processed_files int DEFAULT 0;
ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE pdf_batches ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 6. PDF_CANDIDATES
CREATE TABLE IF NOT EXISTS pdf_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES pdf_batches(id),
  vaga_id uuid REFERENCES vagas(id),
  empresa_id uuid REFERENCES empresas(id),
  nome_candidato text,
  cargo_atual text,
  empresa_atual text,
  cidade text,
  email_contato text,
  telefone text,
  linkedin_url text,
  score_final numeric CHECK (score_final BETWEEN 1 AND 5),
  parsed_text text,
  status text DEFAULT 'triado',
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES pdf_batches(id);
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id);
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS nome_candidato text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS cargo_atual text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS empresa_atual text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS email_contato text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS score_final numeric;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS parsed_text text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS status text DEFAULT 'triado';
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 7. CANDIDATE_EVALUATIONS
CREATE TABLE IF NOT EXISTS candidate_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES pdf_candidates(id),
  criteria_id uuid REFERENCES criteria(id),
  nota numeric CHECK (nota BETWEEN 1 AND 5),
  nota_manual numeric,
  justificativa text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES pdf_candidates(id);
ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS criteria_id uuid REFERENCES criteria(id);
ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS nota numeric;
ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS nota_manual numeric;
ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS justificativa text;
ALTER TABLE candidate_evaluations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 8. PIPELINE_ENTRIES
CREATE TABLE IF NOT EXISTS pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES pdf_candidates(id),
  vaga_id uuid REFERENCES vagas(id),
  empresa_id uuid REFERENCES empresas(id),
  status text DEFAULT 'triado',
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES pdf_candidates(id);
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id);
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS status text DEFAULT 'triado';
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE pipeline_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- 9. PIPELINE_HISTORY
CREATE TABLE IF NOT EXISTS pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES pipeline_entries(id),
  status_anterior text,
  status_novo text,
  alterado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_history ADD COLUMN IF NOT EXISTS entry_id uuid REFERENCES pipeline_entries(id);
ALTER TABLE pipeline_history ADD COLUMN IF NOT EXISTS status_anterior text;
ALTER TABLE pipeline_history ADD COLUMN IF NOT EXISTS status_novo text;
ALTER TABLE pipeline_history ADD COLUMN IF NOT EXISTS alterado_por uuid REFERENCES usuarios(id);
ALTER TABLE pipeline_history ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 10. LINKEDIN_SEARCHES
CREATE TABLE IF NOT EXISTS linkedin_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid REFERENCES vagas(id),
  empresa_id uuid REFERENCES empresas(id),
  query text,
  filtros jsonb,
  resultados jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES vagas(id);
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id);
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS query text;
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS filtros jsonb;
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS resultados jsonb;
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE linkedin_searches ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- 11. PROFILES_CACHE
CREATE TABLE IF NOT EXISTS profiles_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_url text UNIQUE,
  dados jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles_cache ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles_cache ADD COLUMN IF NOT EXISTS dados jsonb;
ALTER TABLE profiles_cache ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE profiles_cache ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


-- ==========================================
-- 2. POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver propria empresa" ON empresas;
CREATE POLICY "Ver propria empresa" ON empresas FOR SELECT USING (id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver usuarios da mesma empresa" ON usuarios;
CREATE POLICY "Ver usuarios da mesma empresa" ON usuarios FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Criar proprio usuario" ON usuarios;
CREATE POLICY "Criar proprio usuario" ON usuarios FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Editar proprio usuario" ON usuarios;
CREATE POLICY "Editar proprio usuario" ON usuarios FOR UPDATE USING (id = auth.uid());

ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso as vagas da empresa" ON vagas;
CREATE POLICY "Acesso as vagas da empresa" ON vagas FOR ALL USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso criteria da empresa" ON criteria;
CREATE POLICY "Acesso criteria da empresa" ON criteria FOR ALL USING (vaga_id IN (SELECT id FROM vagas WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));

ALTER TABLE pdf_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso pdf_batches da empresa" ON pdf_batches;
CREATE POLICY "Acesso pdf_batches da empresa" ON pdf_batches FOR ALL USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE pdf_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso pdf_candidates da empresa" ON pdf_candidates;
CREATE POLICY "Acesso pdf_candidates da empresa" ON pdf_candidates FOR ALL USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso evaluations da empresa" ON candidate_evaluations;
CREATE POLICY "Acesso evaluations da empresa" ON candidate_evaluations FOR ALL USING (candidate_id IN (SELECT id FROM pdf_candidates WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));

ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso pipeline_entries da empresa" ON pipeline_entries;
CREATE POLICY "Acesso pipeline_entries da empresa" ON pipeline_entries FOR ALL USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso pipeline_history da empresa" ON pipeline_history;
CREATE POLICY "Acesso pipeline_history da empresa" ON pipeline_history FOR ALL USING (entry_id IN (SELECT id FROM pipeline_entries WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));

ALTER TABLE linkedin_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso linkedin_searches da empresa" ON linkedin_searches;
CREATE POLICY "Acesso linkedin_searches da empresa" ON linkedin_searches FOR ALL USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE profiles_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de profiles cache global" ON profiles_cache;
CREATE POLICY "Leitura de profiles cache global" ON profiles_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Escrita de profiles cache" ON profiles_cache;
CREATE POLICY "Escrita de profiles cache" ON profiles_cache FOR ALL USING (auth.uid() IS NOT NULL);


-- ==========================================
-- 3. SEED DO SUPERADMIN
-- ==========================================
UPDATE usuarios SET role = 'superadmin' WHERE email = 'delski.contato@gmail.com';
