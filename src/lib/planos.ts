export type PlanoNome = 'trial' | 'starter' | 'pro' | 'agencia' | 'cancelado' | 'suspenso';

export type EmpresaSimples = {
  id: string;
  plano: string;
  subscription_status: string;
  trial_expires_at: string;
  limite_pdfs_mes?: number;
};

export interface PlanoInfo {
  nome: string;
  preco?: number;
  pagarme_plan_id?: string;
  limite_pdfs_mes: number;
  limite_buscas_linkedin: number;
  limite_vagas: number;
  duracao_dias?: number;
  linkedin_bloqueado: boolean;
  agente_ia_bloqueado: boolean;
  destaque?: boolean;
}

export const PLANOS: Record<string, PlanoInfo> = {
  trial: {
    nome: 'Trial Gratuito',
    limite_pdfs_mes: 15,
    limite_buscas_linkedin: 3,
    limite_vagas: 1,
    duracao_dias: 14,
    linkedin_bloqueado: false,
    agente_ia_bloqueado: true,
  },
  starter: {
    nome: 'Starter',
    preco: 149,
    pagarme_plan_id: process.env.PAGARME_PLAN_STARTER,
    limite_pdfs_mes: 100,
    limite_buscas_linkedin: 50,
    limite_vagas: 5,
    linkedin_bloqueado: false,
    agente_ia_bloqueado: false,
  },
  pro: {
    nome: 'Pro',
    preco: 299,
    pagarme_plan_id: process.env.PAGARME_PLAN_PRO,
    limite_pdfs_mes: 500,
    limite_buscas_linkedin: 200,
    limite_vagas: 999,
    linkedin_bloqueado: false,
    agente_ia_bloqueado: false,
    destaque: true,
  },
  agencia: {
    nome: 'Agência',
    preco: 599,
    pagarme_plan_id: process.env.PAGARME_PLAN_AGENCIA,
    limite_pdfs_mes: 9999,
    limite_buscas_linkedin: 9999,
    limite_vagas: 999,
    linkedin_bloqueado: false,
    agente_ia_bloqueado: false,
  },
};

export function getPlanoAtual(empresa: EmpresaSimples) {
  if (empresa.subscription_status === 'active') {
    return empresa.plano;
  }
  if (empresa.plano === 'trial' || empresa.plano === 'trial_starter') {
    const expirou = new Date(empresa.trial_expires_at) < new Date();
    if (expirou) return 'expirado';
    return 'trial';
  }
  return 'expirado';
}

export function getPlanAccessState(empresa: Partial<EmpresaSimples> | undefined, usedThisMonth: number) {
  const planKey = (empresa?.plano || 'trial').toLowerCase();
  const normalizedPlan = planKey === 'trial_starter' ? 'trial' : planKey;
  const planConfig = PLANOS[normalizedPlan] || PLANOS.trial;
  const isTrial = normalizedPlan === 'trial';
  const isActiveSubscription = empresa?.subscription_status === 'active' || empresa?.subscription_status === 'trialing';
  const pdfLimit = getPdfLimitFromPlan(planKey, empresa) ?? planConfig.limite_pdfs_mes;
  const canUploadPdf = pdfLimit === null ? true : usedThisMonth < pdfLimit;
  const canUseLinkedIn = !planConfig.linkedin_bloqueado && isActiveSubscription;

  return {
    planKey,
    normalizedPlan,
    isTrial,
    isActiveSubscription,
    pdfLimit,
    canUploadPdf,
    canUseLinkedIn,
  };
}

export function podePDF(empresa: EmpresaSimples, usadoMes: number): boolean {
  const planoKey = empresa.plano as keyof typeof PLANOS;
  const plano = PLANOS[planoKey] || PLANOS.trial;
  return usadoMes < plano.limite_pdfs_mes;
}

export function podeLinkedIn(empresa: EmpresaSimples): boolean {
  const planoKey = empresa.plano as keyof typeof PLANOS;
  const plano = PLANOS[planoKey] || PLANOS.trial;
  return !plano.linkedin_bloqueado && empresa.subscription_status === 'active';
}

// Return PDF export/upload limit for a given company plan key or empresa object.
export function getPdfLimitFromPlan(planKey?: string | null, empresa?: Partial<EmpresaSimples>): number | null {
  // Normalize known external plan keys
  const mapping: Record<string, string> = {
    'trial_starter': 'trial',
    'profissional': 'starter',
    'enterprise': 'pro',
    'superadmin': 'agencia',
    'admin': 'agencia',
  };

  if (!planKey && empresa?.plano) planKey = empresa.plano;

  const normalized = planKey ? (mapping[planKey] ?? planKey) : undefined;

  if (!normalized) {
    // fallback to empresa limit or default 10
    return empresa?.limite_pdfs_mes ?? 10;
  }

  // Known named plans
  if (normalized === 'trial') return 15;
  if (normalized === 'starter') return 100;
  if (normalized === 'pro') return 500;
  if (normalized === 'agencia') return null; // effectively unlimited

  // fallback
  return empresa?.limite_pdfs_mes ?? 10;
}
