-- Migração: Campos do Stripe para Faturamento e Assinaturas

ALTER TABLE public.empresas 
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;
