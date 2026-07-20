import type { SupabaseClient } from "@supabase/supabase-js";

export const LIMITES_PLANO = {
  trial:   { pdfs_mes: 15,   buscas: 3,    agentes: 0,  candidatos_api: 20  },
  starter: { pdfs_mes: 100,  buscas: 50,   agentes: 0,  candidatos_api: 50  },
  pro:     { pdfs_mes: 500,  buscas: 200,  agentes: 3,  candidatos_api: 100 },
  agencia: { pdfs_mes: 9999, buscas: 9999, agentes: 10, candidatos_api: 200 },
} as const;

export type PlanoKey = keyof typeof LIMITES_PLANO;

export type LimiteResultado = {
  permitido: boolean;
  usado: number;
  limite: number;
  mensagem?: string;
};

function isTrial(plano: string | null | undefined, status: string | null | undefined): boolean {
  return plano === "trial" || plano === "trial_starter" || status === "trialing";
}

function normalizePlano(plano: string | null | undefined): PlanoKey {
  const p = (plano || "trial").toLowerCase();
  if (p === "trial_starter") return "trial";
  if (p === "profissional") return "starter";
  if (p === "enterprise") return "pro";
  if (["admin", "superadmin"].includes(p)) return "agencia";
  return (p in LIMITES_PLANO ? p : "trial") as PlanoKey;
}

/**
 * Verifica limite server-side — usar em todas as APIs que consomem créditos.
 * Lê o banco (tabela empresas) e compara com o plano configurado.
 */
export async function verificaLimite(
  supabase: SupabaseClient,
  empresaId: string,
  tipo: "pdfs_mes" | "buscas"
): Promise<LimiteResultado> {
  const { data: empresa } = await supabase
    .from("empresas")
    .select(
      "plano, subscription_status, creditos_pdfs_usados, creditos_buscas_usados, limite_pdfs_mes, limite_buscas_linkedin"
    )
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return { permitido: false, usado: 0, limite: 0, mensagem: "Empresa não encontrada" };
  }

  const plano = normalizePlano(empresa.plano);
  const trial = isTrial(empresa.plano, empresa.subscription_status);
  const configPlano = LIMITES_PLANO[plano];

  if (tipo === "pdfs_mes") {
    const limite = trial ? 15 : (empresa.limite_pdfs_mes || configPlano.pdfs_mes);
    const usado = empresa.creditos_pdfs_usados || 0;
    return {
      permitido: usado < limite,
      usado,
      limite,
      mensagem:
        usado >= limite
          ? trial
            ? `Trial: limite de ${limite} PDFs atingido. Faça upgrade.`
            : `Limite mensal de ${limite} PDFs atingido.`
          : undefined,
    };
  }

  if (tipo === "buscas") {
    const limite = trial ? 3 : (empresa.limite_buscas_linkedin || configPlano.buscas);
    const usado = empresa.creditos_buscas_usados || 0;
    return {
      permitido: usado < limite,
      usado,
      limite,
      mensagem:
        usado >= limite
          ? trial
            ? `Trial: ${limite} buscas incluídas. Faça upgrade.`
            : `Limite de ${limite} buscas atingido.`
          : undefined,
    };
  }

  return { permitido: true, usado: 0, limite: 9999 };
}

/**
 * Retorna se a empresa pode usar o Agente IA (bloqueado no trial).
 */
export function podeUsarAgente(plano: string | null | undefined, status: string | null | undefined): boolean {
  if (isTrial(plano, status)) return false;
  const p = normalizePlano(plano);
  return LIMITES_PLANO[p].agentes > 0;
}

/**
 * Retorna o máximo de candidatos que a API deve retornar por busca.
 */
export function getMaxCandidatosApi(plano: string | null | undefined): number {
  const p = normalizePlano(plano);
  return LIMITES_PLANO[p].candidatos_api;
}
