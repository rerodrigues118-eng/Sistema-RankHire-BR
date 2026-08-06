-- ============================================================
-- RankHire BR — Migration 019: Fix Multi-Tenancy Data Isolation (P0 Security Fix)
-- ============================================================

-- 1. FUNÇÃO SECURITY DEFINER PARA OBTER EMPRESA DO USUÁRIO
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 2. TRIGGER AUTOMÁTICO: NOVO USUÁRIO RECEBE UMA EMPRESA EXCLUSIVA SE NÃO TIVER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_nome text;
  v_empresa_nome text;
  v_cargo text;
BEGIN
  -- Extrai metadados do Auth
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_empresa_nome := COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa de ' || v_nome);
  v_cargo := COALESCE(NEW.raw_user_meta_data->>'cargo', 'Recrutador');

  -- Verifica se o usuário já tem registro na tabela usuarios com empresa_id
  SELECT empresa_id INTO v_empresa_id FROM public.usuarios WHERE id = NEW.id;

  IF v_empresa_id IS NULL THEN
    -- Cria nova empresa isolada para o novo usuário
    INSERT INTO public.empresas (
      nome,
      plano,
      subscription_status,
      trial_expires_at,
      limite_pdfs_mes,
      limite_buscas_linkedin,
      creditos_pdfs_usados,
      creditos_buscas_usados
    ) VALUES (
      v_empresa_nome,
      'trial',
      'trialing',
      now() + interval '7 days',
      15,
      3,
      0,
      0
    ) RETURNING id INTO v_empresa_id;

    -- Cria ou atualiza o registro em usuarios vinculado a essa empresa
    INSERT INTO public.usuarios (
      id,
      empresa_id,
      nome,
      email,
      cargo,
      role
    ) VALUES (
      NEW.id,
      v_empresa_id,
      v_nome,
      NEW.email,
      v_cargo,
      'admin'
    ) ON CONFLICT (id) DO UPDATE SET
      empresa_id = EXCLUDED.empresa_id,
      nome = COALESCE(public.usuarios.nome, EXCLUDED.nome),
      email = COALESCE(public.usuarios.email, EXCLUDED.email);
  END IF;

  RETURN NEW;
END;
$$;

-- Registra a Trigger em auth.users se ainda não existir
DROP TRIGGER IF EXISTS on_auth_user_created_isolation ON auth.users;
CREATE TRIGGER on_auth_user_created_isolation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. AJUSTE DE COLUNAS empresa_id E ÍNDICES DE DESEMPENHO
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vagas_empresa_id ON public.vagas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdf_candidates_empresa_id ON public.pdf_candidates(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdf_batches_empresa_id ON public.pdf_batches(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_entries_empresa_id ON public.pipeline_entries(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agentes_ia_empresa_id ON public.agentes_ia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_searches_empresa_id ON public.linkedin_searches(empresa_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_search_sessions_empresa_id ON public.linkedin_search_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfis_vistos_empresa_id ON public.perfis_vistos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_empresa_id ON public.etiquetas(empresa_id);


-- 4. HABILITA RLS EM TODAS AS TABELAS DE DADOS DE CLIENTE
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_entries DROP CONSTRAINT IF EXISTS check_pipeline_source;
ALTER TABLE public.pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_vistos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_etiquetas ENABLE ROW LEVEL SECURITY;


-- 5. REESCRITA RIGOROSA DE RLS POLICIES (FILTRO ESTRITO POR DONO DA EMPRESA)

-- TABELA: empresas
DROP POLICY IF EXISTS "empresas_select_strict" ON public.empresas;
DROP POLICY IF EXISTS "empresas_update_strict" ON public.empresas;
DROP POLICY IF EXISTS "empresas_select" ON public.empresas;
DROP POLICY IF EXISTS "empresas_update" ON public.empresas;
DROP POLICY IF EXISTS "empresas_delete" ON public.empresas;
DROP POLICY IF EXISTS "empresas_insert" ON public.empresas;
DROP POLICY IF EXISTS "Ver propria empresa" ON public.empresas;

CREATE POLICY "empresas_select_strict" ON public.empresas
  FOR SELECT USING ((auth.role() = 'service_role') OR (id = public.get_empresa_id()));
CREATE POLICY "empresas_update_strict" ON public.empresas
  FOR UPDATE USING ((auth.role() = 'service_role') OR (id = public.get_empresa_id()))
  WITH CHECK ((auth.role() = 'service_role') OR (id = public.get_empresa_id()));

-- TABELA: usuarios
DROP POLICY IF EXISTS "usuarios_select_strict" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_strict" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_strict" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_company" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;

CREATE POLICY "usuarios_select_strict" ON public.usuarios
  FOR SELECT USING ((auth.role() = 'service_role') OR (id = auth.uid()) OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "usuarios_update_strict" ON public.usuarios
  FOR UPDATE USING ((auth.role() = 'service_role') OR (id = auth.uid()))
  WITH CHECK ((auth.role() = 'service_role') OR (id = auth.uid()));
CREATE POLICY "usuarios_insert_strict" ON public.usuarios
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (id = auth.uid()));

-- TABELA: vagas
DROP POLICY IF EXISTS "vagas_select" ON public.vagas;
DROP POLICY IF EXISTS "vagas_insert" ON public.vagas;
DROP POLICY IF EXISTS "vagas_update" ON public.vagas;
DROP POLICY IF EXISTS "vagas_delete" ON public.vagas;
DROP POLICY IF EXISTS "Acesso as vagas da empresa" ON public.vagas;

CREATE POLICY "vagas_select" ON public.vagas
  FOR SELECT USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "vagas_insert" ON public.vagas
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "vagas_update" ON public.vagas
  FOR UPDATE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL))
  WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "vagas_delete" ON public.vagas
  FOR DELETE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));

-- TABELA: criteria
DROP POLICY IF EXISTS "criteria_select" ON public.criteria;
DROP POLICY IF EXISTS "criteria_insert" ON public.criteria;
DROP POLICY IF EXISTS "criteria_update" ON public.criteria;
DROP POLICY IF EXISTS "criteria_delete" ON public.criteria;
DROP POLICY IF EXISTS "Acesso criteria da empresa" ON public.criteria;

CREATE POLICY "criteria_select" ON public.criteria
  FOR SELECT USING ((auth.role() = 'service_role') OR (vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL)));
CREATE POLICY "criteria_insert" ON public.criteria
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL)));
CREATE POLICY "criteria_update" ON public.criteria
  FOR UPDATE USING ((auth.role() = 'service_role') OR (vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL)));
CREATE POLICY "criteria_delete" ON public.criteria
  FOR DELETE USING ((auth.role() = 'service_role') OR (vaga_id IN (SELECT id FROM public.vagas WHERE empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL)));

-- TABELA: pdf_batches
DROP POLICY IF EXISTS "pdf_batches_select" ON public.pdf_batches;
DROP POLICY IF EXISTS "pdf_batches_insert" ON public.pdf_batches;
DROP POLICY IF EXISTS "pdf_batches_update" ON public.pdf_batches;
DROP POLICY IF EXISTS "pdf_batches_delete" ON public.pdf_batches;

CREATE POLICY "pdf_batches_select" ON public.pdf_batches
  FOR SELECT USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_batches_insert" ON public.pdf_batches
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_batches_update" ON public.pdf_batches
  FOR UPDATE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_batches_delete" ON public.pdf_batches
  FOR DELETE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));

-- TABELA: pdf_candidates
DROP POLICY IF EXISTS "pdf_candidates_select" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_insert" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_update" ON public.pdf_candidates;
DROP POLICY IF EXISTS "pdf_candidates_delete" ON public.pdf_candidates;

CREATE POLICY "pdf_candidates_select" ON public.pdf_candidates
  FOR SELECT USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_candidates_insert" ON public.pdf_candidates
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_candidates_update" ON public.pdf_candidates
  FOR UPDATE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pdf_candidates_delete" ON public.pdf_candidates
  FOR DELETE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));

-- TABELA: candidate_evaluations
DROP POLICY IF EXISTS "candidate_evaluations_strict" ON public.candidate_evaluations;
DROP POLICY IF EXISTS "candidate_evaluations_company_access" ON public.candidate_evaluations;

CREATE POLICY "candidate_evaluations_strict" ON public.candidate_evaluations
  FOR ALL USING ((auth.role() = 'service_role') OR (candidate_id IN (SELECT id FROM public.pdf_candidates WHERE empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL)));

-- TABELA: pipeline_entries
DROP POLICY IF EXISTS "pipeline_entries_select" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_insert" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_update" ON public.pipeline_entries;
DROP POLICY IF EXISTS "pipeline_entries_delete" ON public.pipeline_entries;

CREATE POLICY "pipeline_entries_select" ON public.pipeline_entries
  FOR SELECT USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pipeline_entries_insert" ON public.pipeline_entries
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pipeline_entries_update" ON public.pipeline_entries
  FOR UPDATE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "pipeline_entries_delete" ON public.pipeline_entries
  FOR DELETE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));

-- TABELA: agentes_ia
DROP POLICY IF EXISTS "agentes_select" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_insert" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_update" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_delete" ON public.agentes_ia;
DROP POLICY IF EXISTS "agentes_empresa" ON public.agentes_ia;

CREATE POLICY "agentes_select" ON public.agentes_ia
  FOR SELECT USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "agentes_insert" ON public.agentes_ia
  FOR INSERT WITH CHECK ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "agentes_update" ON public.agentes_ia
  FOR UPDATE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
CREATE POLICY "agentes_delete" ON public.agentes_ia
  FOR DELETE USING ((auth.role() = 'service_role') OR (empresa_id = public.get_empresa_id() AND empresa_id IS NOT NULL));
