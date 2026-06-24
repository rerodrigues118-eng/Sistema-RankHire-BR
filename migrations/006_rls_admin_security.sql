-- Correcoes de RLS e consistencia para auditoria de producao.

ALTER TABLE pdf_candidates ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS admin_email text;

-- A migration 005 referenciava "users"; a tabela correta do app e "usuarios".
DROP POLICY IF EXISTS "Acesso as proprias agencias_ia" ON agentes_ia;
CREATE POLICY "Acesso as proprias agencias_ia"
  ON agentes_ia
  FOR ALL
  USING (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  )
  WITH CHECK (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Acesso as proprias calibracoes" ON agente_calibracoes;
CREATE POLICY "Acesso as proprias calibracoes"
  ON agente_calibracoes
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Acesso aos proprios candidatos do agente" ON agente_candidatos;
CREATE POLICY "Acesso aos proprios candidatos do agente"
  ON agente_candidatos
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Acesso aos proprios runs" ON agente_runs;
CREATE POLICY "Acesso aos proprios runs"
  ON agente_runs
  FOR ALL
  USING (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    agente_id IN (
      SELECT id FROM agentes_ia WHERE empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Acesso linkedin_searches da empresa" ON linkedin_searches;
CREATE POLICY "Acesso linkedin_searches da empresa"
  ON linkedin_searches
  FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "empresa_vê_proprios_perfis" ON perfis_vistos;
DROP POLICY IF EXISTS "empresa_vÃª_proprios_perfis" ON perfis_vistos;
CREATE POLICY "empresa_vê_proprios_perfis"
  ON perfis_vistos
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "empresa_vê_proprias_sessoes" ON linkedin_search_sessions;
DROP POLICY IF EXISTS "empresa_vÃª_proprias_sessoes" ON linkedin_search_sessions;
CREATE POLICY "empresa_vê_proprias_sessoes"
  ON linkedin_search_sessions
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
