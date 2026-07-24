-- ============================================================
-- RankHire BR - Migration: Expansão de Plataforma v2
-- Módulos: Onboarding Telemetria, Dashboard Gamificação,
--          Agente IA v2, Busca NLP
-- ============================================================

-- ── Módulo 1: Onboarding Telemetria ─────────────────────────
-- Adiciona campos de onboarding à tabela usuarios (caso não existam)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_metadata  JSONB    DEFAULT NULL;

-- ── Módulo 2: Dashboard - Sessões de Busca (para checklist) ─
-- Tabela para rastrear sessões de busca LinkedIn por empresa
CREATE TABLE IF NOT EXISTS public.linkedin_search_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  filtros     JSONB,
  resultados  INT  DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linkedin_search_sessions_empresa
  ON public.linkedin_search_sessions(empresa_id);

ALTER TABLE public.linkedin_search_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ler proprias sessoes de busca"
  ON public.linkedin_search_sessions
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- ── Módulo 3: Agentes IA v2 ──────────────────────────────────
-- Novos campos para categorização e controle de acesso
ALTER TABLE public.agentes_ia
  ADD COLUMN IF NOT EXISTS categoria      TEXT    DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS nivel_acesso   TEXT    DEFAULT 'privado' CHECK (nivel_acesso IN ('compartilhado', 'privado')),
  ADD COLUMN IF NOT EXISTS colaboradores  JSONB   DEFAULT '[]'::jsonb;

-- Índice para listagem de agentes compartilhados da empresa
CREATE INDEX IF NOT EXISTS idx_agentes_ia_empresa_acesso
  ON public.agentes_ia(empresa_id, nivel_acesso);

-- ── Módulo 3: Paywall - Contagem de buscas por agente ───────
-- Tabela para rastrear uso de buscas por agente (controle freemium)
CREATE TABLE IF NOT EXISTS public.agente_search_usage (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente_id    UUID NOT NULL REFERENCES public.agentes_ia(id) ON DELETE CASCADE,
  empresa_id   UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id   UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo         TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'automatico'
  resultados   INT  DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agente_search_usage_agente
  ON public.agente_search_usage(agente_id, created_at DESC);

ALTER TABLE public.agente_search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver uso dos proprios agentes"
  ON public.agente_search_usage
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- ── Módulo 4: Histórico de buscas NLP ────────────────────────
-- Tabela para rastrear queries NLP e filtros extraídos
CREATE TABLE IF NOT EXISTS public.nlp_search_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id    UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id    UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  query_original TEXT NOT NULL,
  criterios     JSONB DEFAULT '[]'::jsonb,
  filtros       JSONB DEFAULT '{}'::jsonb,
  vaga_id       UUID REFERENCES public.vagas(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nlp_search_history_empresa
  ON public.nlp_search_history(empresa_id, created_at DESC);

ALTER TABLE public.nlp_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver historico proprio de NLP"
  ON public.nlp_search_history
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- ── Limpeza e grants ────────────────────────────────────────
GRANT SELECT ON public.linkedin_search_sessions TO authenticated;
GRANT SELECT ON public.agente_search_usage TO authenticated;
GRANT SELECT ON public.nlp_search_history TO authenticated;

-- ── Verificação final ───────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'Migration RankHire v2 aplicada com sucesso em %', NOW();
END $$;
