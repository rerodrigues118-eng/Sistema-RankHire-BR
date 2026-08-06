-- Migration para suporte a configurações de Integrações no SaaS RankHire BR
CREATE TABLE IF NOT EXISTS integracoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_refresh_token TEXT,
  auto_generate_meet BOOLEAN DEFAULT TRUE,
  sync_events BOOLEAN DEFAULT TRUE,
  weekly_email_backup BOOLEAN DEFAULT FALSE,
  export_format VARCHAR(10) DEFAULT 'csv',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, user_id)
);

-- Habilitar RLS
ALTER TABLE integracoes_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem gerenciar integracoes de sua empresa"
  ON integracoes_config
  FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
