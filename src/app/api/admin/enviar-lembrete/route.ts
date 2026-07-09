import { requireAuth } from "@/lib/auth-guard";
import { fetchWithTimeout, handleApiError } from "@/lib/api";
import { logAdminAction, requireAdminContext } from "@/lib/admin";
import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL = "https://n8n.srv1695139.hstgr.cloud/webhook/rankhire-admin-emails";

type EmpresaEmailRow = {
  id: string;
  nome: string | null;
  trial_expires_at: string | null;
  status: string | null;
  usuarios?: { email: string | null; role: string | null }[];
};

export async function POST(req: Request) {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { userId, admin } = await requireAdminContext();
    const { empresa_id, tipo } = (await req.json()) as {
      empresa_id?: string;
      tipo?: "trial_expirando" | "boas_vindas" | "conta_suspensa";
    };

    if (!empresa_id || !tipo) {
      return NextResponse.json({ error: "empresa_id e tipo sao obrigatorios" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("empresas")
      .select("id,nome,trial_expires_at,status,usuarios(email,role)")
      .eq("id", empresa_id)
      .single();

    const empresa = data as EmpresaEmailRow | null;

    if (error || !empresa) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const adminUser = empresa.usuarios?.find((u) => u.role === "admin") || empresa.usuarios?.[0];
    const email = adminUser?.email;

    if (!email) {
      return NextResponse.json({ error: "E-mail da empresa nao encontrado" }, { status: 400 });
    }

    const trialExpires = empresa.trial_expires_at ? new Date(empresa.trial_expires_at) : null;
    const diasRestantes = trialExpires
      ? Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const payload: Record<string, unknown> = {
      tipo,
      email,
      nome_empresa: empresa.nome || "Empresa",
    };

    if (tipo === "trial_expirando" && diasRestantes !== null) {
      payload.dias_restantes = diasRestantes;
    }

    if (tipo === "conta_suspensa") {
      payload.motivo = "Inadimplencia ou violacao dos termos";
    }

    const n8nRes = await fetchWithTimeout(
      N8N_WEBHOOK_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      30_000,
    );

    if (!n8nRes.ok) {
      const text = await n8nRes.text();
      return NextResponse.json({ error: `n8n retornou erro: ${text}` }, { status: 502 });
    }

    await logAdminAction({
      adminId: userId,
      empresaId: empresa_id,
      acao: `email_${tipo}`,
      detalhes: { email, tipo },
    });

    return NextResponse.json({ success: true, enviado_para: email, tipo });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
