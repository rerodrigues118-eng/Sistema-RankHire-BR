-- Migration: 010_admin_auth.sql
-- Cria tabelas para autenticação do painel administrativo (admin_usuarios, admin_sessoes)

CREATE TABLE IF NOT EXISTS admin_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  ativo boolean NOT NULL DEFAULT true,
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_usuarios(id) ON DELETE CASCADE,
  token_id text NOT NULL,
  token_hash text NOT NULL,
  ip text,
  user_agent text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessoes_admin_id ON admin_sessoes(admin_id);
