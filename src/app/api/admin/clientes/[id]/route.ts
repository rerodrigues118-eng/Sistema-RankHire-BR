import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { logAdminAction, requireAdminContext } from "@/lib/admin";
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
  if (status === "active" || status === "paid" || status === "pagante") return "ativo";
  if (status === "suspended" || status === "suspenso") return "suspenso";
  if (status === "canceled" || status === "cancelado" || status === "ended") return "cancelado";
  return status;
}

type UpdateEmpresaBody = {
  plano?: string;
  status?: string;
  nome?: string;
  cnpj?: string;
  trial_expires_at?: string | null;
  mrr_centavos?: number;
  confirmation?: string;
};

const camposPermitidos = [
  "plano",
  "status",
  "nome",
  "cnpj",
  "trial_expires_at",
  "mrr_centavos",
] as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { admin } = await requireAdminContext();
    const { id } = await params;

    const { data: empresa, error } = await admin
      .from("empresas")
      .select(
        "id,nome,cnpj,admin_email,plano,status,trial_expires_at,created_at,updated_at,mrr_centavos,motivo_suspensao,notas_internas,subscription_status,current_period_start,current_period_end,usuarios(id,email,role,created_at)",
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const usuarios = (empresa?.usuarios || []).map((usuario) => ({
      id: usuario.id,
      email: normalizeText(usuario.email),
      role: normalizeRole(usuario.role),
      created_at: usuario.created_at || null,
    }));

    const adminUser = usuarios.find((usuario) => ["admin", "superadmin"].includes(usuario.role)) || usuarios[0];

    return NextResponse.json({
      empresa: {
        ...empresa,
        nome: normalizeText(empresa?.nome, "Empresa sem nome"),
        cnpj: normalizeText(empresa?.cnpj),
        admin_email: normalizeText(empresa?.admin_email || adminUser?.email),
        plano: normalizePlan(empresa?.plano),
        status: normalizeStatus(empresa?.status),
        trial_expires_at: empresa?.trial_expires_at || null,
        created_at: empresa?.created_at || null,
        updated_at: empresa?.updated_at || null,
        mrr_centavos: Number(empresa?.mrr_centavos || 0),
        motivo_suspensao: normalizeText(empresa?.motivo_suspensao, ""),
        notas_internas: normalizeText(empresa?.notas_internas, ""),
        subscription_status: normalizeStatus(empresa?.subscription_status),
        current_period_start: empresa?.current_period_start || null,
        current_period_end: empresa?.current_period_end || null,
        usuarios,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { userId, admin } = await requireAdminContext();
    const { id } = await params;
    const body = (await req.json()) as UpdateEmpresaBody;

    if (body.status === "suspenso" || body.status === "suspended") {
      if (body.confirmation !== "CONFIRMAR") {
        return NextResponse.json(
          { error: 'Para suspender, digite "CONFIRMAR".' },
          { status: 400 },
        );
      }
    }

    const update: Partial<UpdateEmpresaBody> = {};
    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        update[campo] = body[campo] as never;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nenhum campo valido para atualizar" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("empresas")
      .update(update)
      .eq("id", id)
      .select("id,nome,cnpj,plano,status,trial_expires_at,mrr_centavos,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: userId,
      empresaId: id,
      acao: "dados_editados",
      detalhes: update as Record<string, unknown>,
    });

    return NextResponse.json({ empresa: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { userId, admin } = await requireAdminContext();
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { confirmation?: string };

    if (body.confirmation !== "EXCLUIR PERMANENTEMENTE") {
      return NextResponse.json({ error: 'Para excluir, digite "EXCLUIR PERMANENTEMENTE".' }, { status: 400 });
    }

    const { error } = await admin.from("empresas").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: userId,
      empresaId: id,
      acao: "conta_excluida",
      detalhes: { confirmation: "EXCLUIR PERMANENTEMENTE" },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
