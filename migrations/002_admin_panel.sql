-- Migração: Painel Admin, Logs, Roles e Entidades Financeiras

-- 1. Criação da tabela de logs do painel admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  acao text NOT NULL,
  empresa_id uuid, -- Pode ser null se a ação não for específica a uma empresa
  detalhes jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS para admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Apenas superadmins podem ver e inserir logs
CREATE POLICY "Superadmins podem ver todos os logs"
  ON admin_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins podem inserir logs"
  ON admin_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.role = 'superadmin'
    )
  );

-- 2. Adição de colunas na tabela de empresas
ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'trial_starter',
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS mrr_centavos int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS motivo_suspensao text,
  ADD COLUMN IF NOT EXISTS notas_internas text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Adição de colunas na tabela de usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'recruiter',
  ADD COLUMN IF NOT EXISTS ultimo_acesso timestamptz,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- 4. Seed: Atualizar usuário específico para superadmin
UPDATE usuarios 
SET role = 'superadmin' 
WHERE email = 'delski.contato@gmail.com';
