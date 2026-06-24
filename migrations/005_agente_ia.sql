-- Tabela: agentes_ia
CREATE TABLE IF NOT EXISTS agentes_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  vaga_id uuid NOT NULL,
  nome text NOT NULL,
  briefing text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'arquivado')),
  frequencia text DEFAULT 'diaria' CHECK (frequencia IN ('diaria', 'semanal', 'manual')),
  score_minimo_notificacao numeric DEFAULT 4.0,
  calibracoes_realizadas int DEFAULT 0,
  criterios_ia jsonb, -- critérios gerados pela IA no setup
  filtros_ia jsonb, -- filtros sugeridos pela IA no setup
  ultima_busca timestamptz,
  proxima_busca timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tabela: agente_calibracoes
CREATE TABLE IF NOT EXISTS agente_calibracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid REFERENCES agentes_ia(id) ON DELETE CASCADE,
  linkedin_url text NOT NULL,
  dados_perfil jsonb, -- dados resumidos do perfil calibrado
  decisao text CHECK (decisao IN ('aprovado', 'rejeitado', 'pulado')),
  created_at timestamptz DEFAULT now()
);

-- Tabela: agente_candidatos
CREATE TABLE IF NOT EXISTS agente_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid REFERENCES agentes_ia(id) ON DELETE CASCADE,
  linkedin_url text NOT NULL,
  dados_perfil jsonb NOT NULL,
  score_final numeric,
  criterios_avaliacao jsonb,
  visto boolean DEFAULT false,
  status text DEFAULT 'novo' CHECK (status IN ('novo', 'shortlist', 'rejeitado')),
  descoberto_em timestamptz DEFAULT now(),
  UNIQUE(agente_id, linkedin_url) -- Impede que o mesmo agente traga a mesma pessoa duas vezes
);

-- Tabela: agente_runs
CREATE TABLE IF NOT EXISTS agente_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid REFERENCES agentes_ia(id) ON DELETE CASCADE,
  perfis_analisados int DEFAULT 0,
  candidatos_encontrados int DEFAULT 0,
  candidatos_score_alto int DEFAULT 0,
  status text CHECK (status IN ('concluido', 'erro', 'rodando')),
  logs jsonb,
  executado_em timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE agentes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_calibracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_runs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para empresa_id

-- 1. agentes_ia
CREATE POLICY "Acesso as proprias agencias_ia"
  ON agentes_ia
  FOR ALL
  USING (
    empresa_id = (SELECT empresa_id FROM users WHERE id = auth.uid())
  );

-- 2. agente_calibracoes
CREATE POLICY "Acesso as proprias calibracoes"
  ON agente_calibracoes
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM users WHERE id = auth.uid())
    )
  );

-- 3. agente_candidatos
CREATE POLICY "Acesso aos proprios candidatos do agente"
  ON agente_candidatos
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM users WHERE id = auth.uid())
    )
  );

-- 4. agente_runs
CREATE POLICY "Acesso aos proprios runs"
  ON agente_runs
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM users WHERE id = auth.uid())
    )
  );
