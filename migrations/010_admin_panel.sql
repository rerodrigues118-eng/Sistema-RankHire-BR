-- Migration 010: admin panel tables

create table if not exists admin_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  role text not null default 'readonly',
  totp_secret text,
  totp_enabled boolean not null default false,
  ativo boolean not null default true,
  ultimo_acesso timestamptz,
  ip_ultimo_acesso text,
  tentativas_login int not null default 0,
  bloqueado_ate timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessoes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_usuarios(id) on delete cascade,
  token_id text not null unique,
  token_hash text not null,
  ip text not null,
  user_agent text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_usuarios(id) on delete set null,
  acao text not null,
  empresa_id uuid,
  nivel text not null default 'INFO',
  dados_antes jsonb,
  dados_depois jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists configuracoes_globais (
  chave text primary key,
  valor text not null,
  descricao text,
  updated_by uuid references admin_usuarios(id),
  updated_at timestamptz not null default now()
);

create table if not exists alertas_seguranca (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  nivel text not null,
  descricao text not null,
  ip_origem text,
  empresa_id uuid,
  resolvido boolean not null default false,
  resolvido_por uuid references admin_usuarios(id),
  created_at timestamptz not null default now()
);

create table if not exists admin_login_attempts (
  ip text primary key,
  attempts int not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_sessoes_token_hash on admin_sessoes(token_hash);
create index if not exists idx_admin_logs_admin_id on admin_logs(admin_id);
create index if not exists idx_admin_logs_empresa_id on admin_logs(empresa_id);
create index if not exists idx_admin_login_attempts_blocked_until on admin_login_attempts(blocked_until);
