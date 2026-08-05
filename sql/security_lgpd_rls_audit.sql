-- ============================================================================
-- AUDITORIA DE SEGURANÇA, LGPD E RLS (ROW LEVEL SECURITY) - RANKHIRE BR
-- DATA: Agosto DE 2026
-- OBJETIVO: Garantir isolamento 100% multi-tenant, tabelas de auditoria imutável,
-- e triggers de deduplicação automática por e-mail e LinkedIn ID.
-- ============================================================================

-- 1. TABELA DE AUDITORIA DE ACESSO E EXPURGO LGPD
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    empresa_id UUID,
    action TEXT NOT NULL, -- VIEW_CANDIDATE, EXPORT_PDF, UPDATE_STATUS, LGPD_FORGET, AI_ENRICH
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alta performance para relatórios de conformidade LGPD
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON public.audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.pdf_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE RLS (ROW LEVEL SECURITY) - ISOLAMENTO MULTI-TENANT

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários acessam apenas candidatos de sua empresa" ON public.pdf_candidates;
DROP POLICY IF EXISTS "Usuários acessam apenas vagas de sua empresa" ON public.vagas;
DROP POLICY IF EXISTS "Apenas admins acessam audit_logs" ON public.audit_logs;

-- Política Vagas: Permite acesso apenas ao criador/empresa autenticada
CREATE POLICY "Usuários acessam apenas vagas de sua empresa"
ON public.vagas
FOR ALL
USING (
    empresa_id = auth.uid() 
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- Política PDF Candidates: Candidatos visíveis apenas se pertecerem a uma vaga da empresa
CREATE POLICY "Usuários acessam apenas candidatos de sua empresa"
ON public.pdf_candidates
FOR ALL
USING (
    vaga_id IN (
        SELECT id FROM public.vagas 
        WHERE empresa_id = auth.uid() 
           OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
    )
);

-- Política Audit Logs: Gravação permitida para usuários autenticados, leitura restrita a admins
CREATE POLICY "Gravação de audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leitura de audit logs restrita"
ON public.audit_logs
FOR SELECT
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    )
);

-- 4. TRIGGER DE DEDUPLICAÇÃO AUTOMÁTICA DE CANDIDATOS POR E-MAIL E LINKEDIN
CREATE OR REPLACE FUNCTION public.fn_deduplicate_candidate()
RETURNS TRIGGER AS $$
DECLARE
    existing_id UUID;
BEGIN
    -- Verifica duplicidade por email_contato ou linkedin_url dentro da mesma vaga
    IF NEW.email_contato IS NOT NULL AND NEW.email_contato != '' THEN
        SELECT id INTO existing_id
        FROM public.pdf_candidates
        WHERE vaga_id = NEW.vaga_id 
          AND LOWER(email_contato) = LOWER(NEW.email_contato)
          AND id != NEW.id
        LIMIT 1;
    END IF;

    IF existing_id IS NULL AND NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' AND NEW.linkedin_url != '#' THEN
        SELECT id INTO existing_id
        FROM public.pdf_candidates
        WHERE vaga_id = NEW.vaga_id 
          AND LOWER(linkedin_url) = LOWER(NEW.linkedin_url)
          AND id != NEW.id
        LIMIT 1;
    END IF;

    -- Se duplicado for encontrado, atualiza o score/resumo do existente e ignora duplicata
    IF existing_id IS NOT NULL THEN
        UPDATE public.pdf_candidates
        SET score_final = GREATEST(pdf_candidates.score_final, NEW.score_final),
            updated_at = NOW()
        WHERE id = existing_id;
        
        RETURN NULL; -- Cancela inserção da duplicata
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_deduplicate_candidate ON public.pdf_candidates;
CREATE TRIGGER trigger_deduplicate_candidate
BEFORE INSERT ON public.pdf_candidates
FOR EACH ROW
EXECUTE FUNCTION public.fn_deduplicate_candidate();
