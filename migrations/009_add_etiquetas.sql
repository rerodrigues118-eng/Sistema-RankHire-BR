-- Migration: 009_add_etiquetas.sql
-- Adiciona tabelas `etiquetas` e `candidate_etiquetas`

CREATE TABLE IF NOT EXISTS etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text DEFAULT '#6B7280',
  posicao int CHECK (posicao BETWEEN 1 AND 4),
  created_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, posicao)
);

CREATE TABLE IF NOT EXISTS candidate_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES pdf_candidates(id) ON DELETE CASCADE,
  etiqueta_id uuid REFERENCES etiquetas(id) ON DELETE CASCADE,
  aplicado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, etiqueta_id)
);
