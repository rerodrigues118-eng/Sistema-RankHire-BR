-- Migration 011: Complete Admin Panel Schema (Supabase)
-- Run this as the `service_role` (or paste into Supabase SQL editor)

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) admin_usuarios
CREATE TABLE IF NOT EXISTS public.admin_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  senha_hash text,
  role text NOT NULL DEFAULT 'readonly',
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_acesso timestamptz,
  ip_ultimo_acesso text,
  tentativas_login int NOT NULL DEFAULT 0,
  bloqueado_ate timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_usuarios_role ON public.admin_usuarios(role);
CREATE INDEX IF NOT EXISTS idx_admin_usuarios_email ON public.admin_usuarios(email);

-- 2) Helper: is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_usuarios au
    WHERE
      ((au.auth_user_id IS NOT NULL AND au.auth_user_id = auth.uid()::uuid)
       OR (au.id::text = auth.uid()::text))
      AND au.role = 'superadmin'
      AND au.ativo = true
  );
$$;

ALTER TABLE public.admin_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_usuarios_select_superadmin ON public.admin_usuarios;
CREATE POLICY admin_usuarios_select_superadmin ON public.admin_usuarios
  FOR SELECT
  USING (public.is_superadmin());

DROP POLICY IF EXISTS admin_usuarios_select_self ON public.admin_usuarios;
CREATE POLICY admin_usuarios_select_self ON public.admin_usuarios
  FOR SELECT
  USING (
    (auth_user_id IS NOT NULL AND auth_user_id = auth.uid()::uuid)
    OR (id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS admin_usuarios_manage_superadmin ON public.admin_usuarios;
CREATE POLICY admin_usuarios_manage_superadmin ON public.admin_usuarios
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS admin_usuarios_update_self ON public.admin_usuarios;
CREATE POLICY admin_usuarios_update_self ON public.admin_usuarios
  FOR UPDATE
  USING (
    (auth_user_id IS NOT NULL AND auth_user_id = auth.uid()::uuid)
    OR (id::text = auth.uid()::text)
  )
  WITH CHECK (
    public.is_superadmin()
    OR role = (
      SELECT au2.role FROM public.admin_usuarios au2
      WHERE (
        (au2.auth_user_id IS NOT NULL AND au2.auth_user_id = auth.uid()::uuid)
        OR (au2.id::text = auth.uid()::text)
      )
      LIMIT 1
    )
  );

-- 3) admin_sessoes (sessions)
CREATE TABLE IF NOT EXISTS public.admin_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admin_usuarios(id) ON DELETE CASCADE,
  token_id text NOT NULL UNIQUE,
  token_hash text NOT NULL,
  ip text NOT NULL,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessoes_token_hash ON public.admin_sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessoes_admin_id ON public.admin_sessoes(admin_id);

ALTER TABLE public.admin_sessoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_sessoes_select_owner_or_super ON public.admin_sessoes;
CREATE POLICY admin_sessoes_select_owner_or_super ON public.admin_sessoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_usuarios au
      WHERE au.id = public.admin_sessoes.admin_id
        AND (
          (au.auth_user_id IS NOT NULL AND au.auth_user_id = auth.uid()::uuid)
          OR (au.id::text = auth.uid()::text)
          OR public.is_superadmin()
        )
    )
  );

DROP POLICY IF EXISTS admin_sessoes_delete_owner_or_super ON public.admin_sessoes;
CREATE POLICY admin_sessoes_delete_owner_or_super ON public.admin_sessoes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_usuarios au
      WHERE au.id = public.admin_sessoes.admin_id
        AND (
          (au.auth_user_id IS NOT NULL AND au.auth_user_id = auth.uid()::uuid)
          OR (au.id::text = auth.uid()::text)
          OR public.is_superadmin()
        )
    )
  );

DROP POLICY IF EXISTS admin_sessoes_insert ON public.admin_sessoes;
CREATE POLICY admin_sessoes_insert ON public.admin_sessoes
  FOR INSERT
  WITH CHECK (
    admin_id IS NOT NULL
  );

-- 4) admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_usuarios(id) ON DELETE SET NULL,
  acao text NOT NULL,
  empresa_id uuid,
  nivel text NOT NULL DEFAULT 'INFO',
  dados_antes jsonb,
  dados_depois jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_empresa_id ON public.admin_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_logs_select_superadmin ON public.admin_logs;
CREATE POLICY admin_logs_select_superadmin ON public.admin_logs
  FOR SELECT
  USING (public.is_superadmin());

DROP POLICY IF EXISTS admin_logs_select_own ON public.admin_logs;
CREATE POLICY admin_logs_select_own ON public.admin_logs
  FOR SELECT
  USING (
    (admin_id IS NOT NULL AND admin_id = (
      SELECT id FROM public.admin_usuarios WHERE
        (auth_user_id IS NOT NULL AND auth_user_id = auth.uid()::uuid)
        OR (id::text = auth.uid()::text)
      LIMIT 1
    ))
  );

DROP POLICY IF EXISTS admin_logs_insert_super ON public.admin_logs;
CREATE POLICY admin_logs_insert_super ON public.admin_logs
  FOR INSERT
  WITH CHECK (public.is_superadmin());

-- 5) configuracoes_globais
CREATE TABLE IF NOT EXISTS public.configuracoes_globais (
  chave text PRIMARY KEY,
  valor text NOT NULL,
  descricao text,
  updated_by uuid REFERENCES public.admin_usuarios(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS configuracoes_globais_manage_super ON public.configuracoes_globais;
CREATE POLICY configuracoes_globais_manage_super ON public.configuracoes_globais
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 6) alertas_seguranca
CREATE TABLE IF NOT EXISTS public.alertas_seguranca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  nivel text NOT NULL,
  descricao text NOT NULL,
  ip_origem text,
  empresa_id uuid,
  resolvido boolean NOT NULL DEFAULT false,
  resolvido_por uuid REFERENCES public.admin_usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alertas_seguranca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS alertas_seg_manage_super ON public.alertas_seguranca;
CREATE POLICY alertas_seg_manage_super ON public.alertas_seguranca
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 7) admin_login_attempts
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  ip text PRIMARY KEY,
  attempts int NOT NULL DEFAULT 0,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_blocked_until ON public.admin_login_attempts(blocked_until);

-- 8) update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_timestamp() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_timestamp_trigger_admin_usuarios'
  ) THEN
    CREATE TRIGGER update_timestamp_trigger_admin_usuarios
      BEFORE UPDATE ON public.admin_usuarios
      FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
  END IF;
END;
$$;

-- 9) Seeds note (run as service_role)
-- INSERT INTO public.admin_usuarios (nome, email, senha_hash, role, totp_enabled, ativo)
-- VALUES ('Super Admin', 'admin@example.com', '<BCRYPT_HASH>', 'superadmin', false, true);

-- End migration 011
