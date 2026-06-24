import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type LabelInput = {
  id?: string;
  nome: string;
  cor: string;
  posicao: number;
};

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

async function getEmpresaId(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("usuarios")
    .select("empresa_id")
    .eq("id", userId)
    .single();

  if (error || !data?.empresa_id) {
    throw new Error(error?.message || "Empresa nao encontrada.");
  }

  return { admin, empresaId: data.empresa_id as string };
}

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const { admin, empresaId } = await getEmpresaId(userId);

    const { data, error } = await admin
      .from("etiquetas")
      .select("id,nome,cor,posicao")
      .eq("empresa_id", empresaId)
      .order("posicao", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ labels: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { labels } = (await req.json()) as { labels?: LabelInput[] };

    if (!Array.isArray(labels) || labels.length !== 4) {
      return NextResponse.json({ error: "Envie exatamente 4 etiquetas." }, { status: 400 });
    }

    const normalized = labels.map((label, index) => ({
      nome: label.nome.trim(),
      cor: HEX_COLOR_REGEX.test(label.cor) ? label.cor : "#6B7280",
      posicao: index + 1,
    }));

    if (normalized.some((label) => !label.nome)) {
      return NextResponse.json({ error: "Todas as etiquetas precisam ter nome." }, { status: 400 });
    }

    const { admin, empresaId } = await getEmpresaId(userId);
    const payload = normalized.map((label) => ({
      ...label,
      empresa_id: empresaId,
    }));

    const { data, error } = await admin
      .from("etiquetas")
      .upsert(payload, { onConflict: "empresa_id,posicao" })
      .select("id,nome,cor,posicao")
      .order("posicao", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ labels: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
