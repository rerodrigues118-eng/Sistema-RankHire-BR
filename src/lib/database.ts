export type Usuario = {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  email: string | null;
  cargo: string | null;
  telefone: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type Empresa = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  tamanho: string | null;
  segmento: string | null;
  plano: string | null;
  status?: string | null;
  subscription_status?: string | null;
  trial_expires_at?: string | null;
  admin_email?: string | null;
  mrr_centavos?: number | null;
  limite_pdfs_mes?: number | null;
  limite_buscas_linkedin?: number | null;
  creditos_pdfs_usados?: number | null;
  creditos_buscas_usados?: number | null;
};

export type EmailUnsubscribeBody = {
  email: string;
  token: string;
};

export type PhoneCheckBody = {
  phone: string;
};

export type ProfilePatchBody = {
  nome?: string;
  cargo?: string;
  avatarUrl?: string | null;
};
