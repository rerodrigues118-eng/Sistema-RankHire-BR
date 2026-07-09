import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { requireAdminContext } from "@/lib/admin";
import { NextResponse } from "next/server";

type EmpresaResumo = {
  status: string | null;
  plano: string | null;
  subscription_status: string | null;
  trial_expires_at: string | null;
  mrr_centavos: number | null;
};

function normalizeRole(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStatus(value: string | null | undefined) {
  const status = normalizeRole(value);
  if (status === "active" || status === "paid" || status === "pagante") return "ativo";
  if (status === "suspended" || status === "suspenso") return "suspenso";
  if (status === "canceled" || status === "cancelado" || status === "ended") return "cancelado";
  return status;
}

export async function GET() {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { admin } = await requireAdminContext();

    const hoje = new Date();
    const em7dias = new Date();
    em7dias.setDate(hoje.getDate() + 7);

    const [empresasRes, logsRes, usageRes] = await Promise.all([
      admin
        .from("empresas")
        .select("status,plano,subscription_status,trial_expires_at,mrr_centavos")
        .order("created_at", { ascending: false }),
      admin
        .from("admin_logs")
        .select("id,acao,created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("vagas")
        .select("id,empresa_id,created_at"),
    ]);

    if (empresasRes.error) {
      return NextResponse.json({ error: empresasRes.error.message }, { status: 500 });
    }

    if (logsRes.error) {
      return NextResponse.json({ error: logsRes.error.message }, { status: 500 });
    }

    if (usageRes.error) {
      return NextResponse.json({ error: usageRes.error.message }, { status: 500 });
    }

    const empresas = (empresasRes.data || []) as EmpresaResumo[];
    const totalClientes = empresas.length;
    const clientesAtivos = empresas.filter((empresa) => {
      const subscription = normalizeStatus(empresa.subscription_status);
      const status = normalizeStatus(empresa.status);
      return subscription === "ativo" || status === "ativo";
    }).length;
    const trials = empresas.filter((empresa) => {
      if (!empresa.trial_expires_at) return false;
      const expiracao = new Date(empresa.trial_expires_at);
      return expiracao >= hoje && expiracao <= em7dias;
    }).length;
    const mrr = empresas.reduce((acc, empresa) => acc + Number(empresa.mrr_centavos || 0), 0);
    const clientesSuspensos = empresas.filter((empresa) => {
      const subscription = normalizeStatus(empresa.subscription_status);
      const status = normalizeStatus(empresa.status);
      return subscription === "cancelado" || status === "suspenso" || status === "cancelado";
    }).length;

    return NextResponse.json({
      metrics: {
        mrr,
        totalClientes,
        clientesAtivos,
        trials,
        clientesSuspensos,
        vagasCriadas: usageRes.data?.length || 0,
      },
      recentLogs: (logsRes.data || []).map((log) => ({
        id: log.id,
        acao: String(log.acao || "").trim() || "evento",
        created_at: log.created_at || new Date().toISOString(),
      })),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
