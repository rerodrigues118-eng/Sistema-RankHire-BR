-- Migração: Campos do Pagar.me e Regras de Limites de Plano

-- 1. Adição de colunas na tabela de empresas
ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS pagarme_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS pagarme_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS pagarme_plan_id text,
  
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trialing',
  
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
  
  -- Limites do plano
  ADD COLUMN IF NOT EXISTS limite_pdfs_mes int DEFAULT 10,
  ADD COLUMN IF NOT EXISTS limite_buscas_linkedin int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_vagas int DEFAULT 1;

-- 2. Função para calcular dias restantes do trial
CREATE OR REPLACE FUNCTION dias_trial_restantes(empresa_id uuid)
RETURNS int AS $$
  SELECT GREATEST(0, 
    EXTRACT(DAY FROM (
      SELECT trial_expires_at FROM empresas WHERE id = empresa_id
    ) - now())::int
  );
$$ LANGUAGE sql;
