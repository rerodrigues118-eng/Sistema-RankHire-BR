import { handleApiError } from "@/lib/api";
import { requireAdminContext } from "@/lib/admin";
import { NextResponse } from "next/server";

function normalizeText(value: string | null | undefined, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeRole(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizePlan(value: string | null | undefined) {
  const plan = normalizeRole(value);
  if (!plan) return "trial_starter";
  if (plan === "trial" || plan === "trial starter" || plan === "trial_starter") return "trial_starter";
  if (plan === "basic" || plan === "starter") return "starter";
  if (plan === "pro" || plan === "professional") return "pro";
  if (plan === "agencia" || plan === "agência" || plan === "agency") return "agencia";
  return plan.replace(/\s+/g, "_");
}

function normalizeStatus(value: string | null | undefined) {
  const status = normalizeRole(value);
  if (!status) return "trial";
  if (["ativo", "active", "paid", "pagante", "trial"].includes(status)) return status === "active" || status === "paid" || status === "pagante" ? "ativo" : status;
  if (status === "suspended" || status === "suspenso") return "suspenso";
  if (status === "canceled" || status === "cancelado" || status === "ended") return "cancelado";
  return status;
}

type EmpresaRow = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  admin_email?: string | null;
  plano: string | null;
  status: string | null;
  trial_expires_at: string | null;
  created_at: string | null;
  mrr_centavos: number | null;
  usuarios?: { id: string; email: string | null; role: string | null }[];
};

export async function GET(req: Request) {
  try {
    const { admin } = await requireAdminContext();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const search = url.searchParams.get("q")?.trim();
    const pageSize = 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
      .from("empresas")
      .select(
        "id,nome,cnpj,admin_email,plano,status,trial_expires_at,created_at,mrr_centavos,usuarios(id,email,role)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%,admin_email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clientes = ((data || []) as EmpresaRow[]).map((emp) => {
      const adminUser =
        emp.usuarios?.find((u) => ["admin", "superadmin"].includes(normalizeRole(u.role))) ||
        emp.usuarios?.[0];
      const adminEmail = normalizeText(adminUser?.email || emp.admin_email);
      const trialExpires = emp.trial_expires_at ? new Date(emp.trial_expires_at) : null;
      const diasRestantes = trialExpires
        ? Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: emp.id,
        nome_fantasia: normalizeText(emp.nome, "Empresa sem nome"),
        cnpj: normalizeText(emp.cnpj),
        admin_email: adminEmail,
        plano: normalizePlan(emp.plano),
        status: normalizeStatus(emp.status),
        trial_expires_at: emp.trial_expires_at || null,
        dias_restantes: diasRestantes,
        created_at: emp.created_at || null,
        mrr_centavos: Number(emp.mrr_centavos || 0),
        total_usuarios: emp.usuarios?.length || 0,
      };
    });

    return NextResponse.json({
      clientes,
      pagination: {
        page,
        page_size: pageSize,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
