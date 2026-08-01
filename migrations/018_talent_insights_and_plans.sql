-- =========================================================
-- MIGRATION 018: TALENT INSIGHTS, CANDIDATE STATUS & SUBSCRIPTION PLANS
-- Sistema RankHire BR (Corrigido para tabelas reais do banco: linkedin_profiles & usuarios)
-- =========================================================

-- 1. Adicionar colunas de status e tags na tabela de perfis de candidatos do LinkedIn
ALTER TABLE public.linkedin_profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Sem status',
ADD COLUMN IF NOT EXISTS custom_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notas_recrutador TEXT;

-- Se existir a tabela pdf_candidates, adicionar colunas de status também
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_candidates') THEN
        ALTER TABLE public.pdf_candidates 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Sem status',
        ADD COLUMN IF NOT EXISTS custom_tags TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS notas_recrutador TEXT;
    END IF;
END $$;

-- 2. Tabela para salvar históricos de Talent Insights por busca inteligente
CREATE TABLE IF NOT EXISTS public.busca_talent_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_id UUID REFERENCES public.vagas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    total_matches INT DEFAULT 0,
    average_experience_years NUMERIC(4,1) DEFAULT 0.0,
    average_tenure_years NUMERIC(4,1) DEFAULT 0.0,
    top_locations JSONB DEFAULT '[]'::jsonb,
    top_skills JSONB DEFAULT '[]'::jsonb,
    top_employers JSONB DEFAULT '[]'::jsonb,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Atualizar tabela de usuarios e perfis com controle de planos de assinatura
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS plano_tipo VARCHAR(20) DEFAULT 'Trial', -- Opções: 'Trial', 'Growth', 'Business'
ADD COLUMN IF NOT EXISTS buscas_gratuitas_restantes INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS limite_creditos_contato INT DEFAULT 5;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfis') THEN
        ALTER TABLE public.perfis 
        ADD COLUMN IF NOT EXISTS plano_tipo VARCHAR(20) DEFAULT 'Trial',
        ADD COLUMN IF NOT EXISTS buscas_gratuitas_restantes INT DEFAULT 3,
        ADD COLUMN IF NOT EXISTS limite_creditos_contato INT DEFAULT 5;
    END IF;
END $$;

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_talent_insights_vaga ON public.busca_talent_insights(vaga_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_status ON public.linkedin_profiles(status);

COMMENT ON TABLE public.busca_talent_insights IS 'Métricas e análises profundas de inteligência de talentos por busca.';
