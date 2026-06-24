-- Migration 004: Rastreamento de Perfis do LinkedIn

-- Tabela para rastrear perfis visualizados
-- Prioridade: perfis recentes aparecem primeiro; vistos ficam no final
CREATE TABLE IF NOT EXISTS perfis_vistos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES vagas(id) ON DELETE SET NULL,
  visto_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  linkedin_url text NOT NULL,
  visto_em timestamptz DEFAULT now(),
  
  -- Metadados do perfil (cache para não refazer busca)
  nome text,
  cargo text,
  empresa text,
  
  UNIQUE(empresa_id, linkedin_url)
);

-- Index para buscar perfis vistos por empresa rapidamente
CREATE INDEX IF NOT EXISTS idx_perfis_vistos_empresa ON perfis_vistos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfis_vistos_url ON perfis_vistos(empresa_id, linkedin_url);
CREATE INDEX IF NOT EXISTS idx_perfis_vistos_vaga ON perfis_vistos(vaga_id);

-- Tabela para salvar sessões de busca com critérios gerados por IA
CREATE TABLE IF NOT EXISTS linkedin_search_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES vagas(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES usuarios(id),
  descricao_livre text,
  criterios jsonb,         -- Array de {nome, descricao, peso}
  filtros_aplicados jsonb, -- Filtros usados na busca
  total_resultados int,
  created_at timestamptz DEFAULT now()
);

-- Index para buscar sessões por empresa
CREATE INDEX IF NOT EXISTS idx_sessions_empresa ON linkedin_search_sessions(empresa_id);

-- RLS básico
ALTER TABLE perfis_vistos ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_search_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas: cada empresa só vê seus próprios dados
CREATE POLICY "empresa_vê_proprios_perfis" ON perfis_vistos
  FOR ALL USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "empresa_vê_proprias_sessoes" ON linkedin_search_sessions
  FOR ALL USING (
    empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );
