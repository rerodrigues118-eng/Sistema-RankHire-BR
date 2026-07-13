import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario, error: userError } = await admin
      .from("usuarios")
      .select("empresa_id, id")
      .eq("id", userId)
      .single();

    if (userError || !usuario?.empresa_id) {
      return NextResponse.json(
        {
          error: "Empresa não encontrada para este usuário.",
          debug: userError?.message,
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as { titulo?: string; jobTitle?: string };
    const titulo = (body.titulo || body.jobTitle || "").trim();

    if (!titulo) {
      return NextResponse.json({ error: "Título da vaga obrigatório" }, { status: 400 });
    }

    console.log("[onboarding/vaga] Criando vaga com empresa_id:", usuario.empresa_id);

    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .insert({
        titulo,
        title: titulo,
        empresa_id: usuario.empresa_id,
        criado_por: usuario.id,
        status: "ativa",
        area: "Geral",
        tipo_contrato: "CLT",
        localizacao: "Remoto",
        briefing: `Vaga criada no onboarding para ${titulo}`,
      })
      .select("id, titulo, title, status, empresa_id")
      .single();

    console.log("[onboarding/vaga] Resultado:", vaga, vagaError);

    if (vagaError) {
      console.error("Erro ao criar vaga no onboarding:", vagaError);
      return NextResponse.json(
        {
          error: `Erro ao criar vaga: ${vagaError.message}`,
          code: vagaError.code,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      vaga: {
        id: vaga.id,
        titulo: vaga.titulo || vaga.title,
        status: vaga.status,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
