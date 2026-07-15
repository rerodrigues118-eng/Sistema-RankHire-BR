export type EmpresaPlano = {
  plano?: string | null;
  subscription_status?: string | null;
  limite_pdfs_mes?: number | null;
  limite_buscas_linkedin?: number | null;
  creditos_pdfs_usados?: number | null;
  creditos_buscas_usados?: number | null;
  role?: string | null;
};

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function isAdminRole(role?: string | null) {
  return ["admin", "superadmin"].includes(normalizeRole(role));
}

export function getPlanoBadge(empresa: EmpresaPlano) {
  if (empresa.subscription_status === "active") {
    if (empresa.plano === "starter") return { label: "STARTER", color: "blue" as const };
    if (empresa.plano === "pro") return { label: "PRO", color: "green" as const };
    if (empresa.plano === "agencia") return { label: "AGÊNCIA", color: "gold" as const };
  }
  if (empresa.plano === "trial" || empresa.plano === "trial_starter" || empresa.subscription_status === "trialing") {
    return { label: "TRIAL", color: "gray" as const };
  }
  return { label: "TRIAL", color: "gray" as const };
}

export function podeUsarAgenteIA(empresa: EmpresaPlano): boolean {
  if (isAdminRole(empresa.role)) return true;
  return (
    empresa.subscription_status === "active" &&
    ["pro", "agencia"].includes(String(empresa.plano || ""))
  );
}

export function podeUsarBuscaLinkedIn(empresa: EmpresaPlano): boolean {
  if (isAdminRole(empresa.role)) return true;
  if (empresa.subscription_status === "active") return true;
  const isTrial =
    empresa.plano === "trial" ||
    empresa.plano === "trial_starter" ||
    empresa.subscription_status === "trialing";
  return isTrial && (empresa.creditos_buscas_usados || 0) < 3;
}

export function podeProcessarPDF(empresa: EmpresaPlano): boolean {
  if (isAdminRole(empresa.role)) return true;
  const isTrial =
    empresa.plano === "trial" ||
    empresa.plano === "trial_starter" ||
    empresa.subscription_status === "trialing";
  const limite = isTrial ? 15 : empresa.limite_pdfs_mes || 500;
  return (empresa.creditos_pdfs_usados || 0) < limite;
}

export function getCreditsInfo(empresa: EmpresaPlano) {
  if (isAdminRole(empresa.role)) {
    return {
      pdfs: {
        usado: empresa.creditos_pdfs_usados || 0,
        limite: null,
        label: "PDFs ilimitados",
      },
      buscas: {
        usado: empresa.creditos_buscas_usados || 0,
        limite: null,
        label: "Buscas ilimitadas",
      },
    };
  }

  const isTrial =
    empresa.plano === "trial" ||
    empresa.plano === "trial_starter" ||
    empresa.subscription_status === "trialing";
  return {
    pdfs: {
      usado: empresa.creditos_pdfs_usados || 0,
      limite: isTrial ? 15 : empresa.limite_pdfs_mes || 500,
      label: isTrial ? "PDFs no trial" : "PDFs este mês",
    },
    buscas: {
      usado: empresa.creditos_buscas_usados || 0,
      limite: isTrial ? 3 : empresa.limite_buscas_linkedin || 200,
      label: isTrial ? "Buscas no trial" : "Buscas este mês",
    },
  };
}
