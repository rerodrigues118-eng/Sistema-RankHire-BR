-- Migration 008: PDF CV Extraction & Export Limits
-- Add new fields for CV data extraction to pdf_candidates table
ALTER TABLE pdf_candidates 
  ADD COLUMN IF NOT EXISTS pretensao_salarial TEXT,
  ADD COLUMN IF NOT EXISTS disponibilidade TEXT,
  ADD COLUMN IF NOT EXISTS regime_preferido TEXT,
  ADD COLUMN IF NOT EXISTS resumo_ia TEXT;

-- Create pdf_exports table to track monthly PDF exports per company/user
CREATE TABLE IF NOT EXISTS pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES pdf_candidates(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ DEFAULT now(),
  mes_referencia TEXT NOT NULL -- Format: YYYY-MM (e.g. '2026-06')
);

-- Index for fast querying exports by company and month
CREATE INDEX IF NOT EXISTS idx_pdf_exports_empresa_mes 
  ON pdf_exports(empresa_id, mes_referencia);

-- Enable RLS for pdf_exports
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;

-- Policies for pdf_exports
CREATE POLICY "Permitir leitura total nas exportações da própria empresa"
  ON pdf_exports
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Permitir inserção de exportações para membros da própria empresa"
  ON pdf_exports
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );
