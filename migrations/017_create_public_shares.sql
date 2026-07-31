-- Migração: Tabela de Compartilhamento Público de Pesquisas

CREATE TABLE IF NOT EXISTS public.public_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas(id) ON DELETE CASCADE,
  share_hash text UNIQUE NOT NULL,
  criterios jsonb,
  candidates jsonb, -- Array JSON com os top 30 candidatos (snapshotted)
  created_at timestamptz DEFAULT now()
);

-- RLS para compartilhamento público
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa (anônima ou autenticada) pode ler compartilhamentos públicos
CREATE POLICY "Leitura pública de compartilhamentos" ON public.public_shares
  FOR SELECT USING (true);

-- Política: apenas recrutadores da mesma empresa podem criar/deletar compartilhamentos
CREATE POLICY "Escrita de compartilhamentos por empresa" ON public.public_shares
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
  );
