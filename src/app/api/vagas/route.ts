import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();

    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) return NextResponse.json({ vagas: [] });

    const { data, error } = await supabase
      .from("vagas")
      .select("id,title,area,tipo_contrato,localizacao,briefing,status,created_at,updated_at")
      .eq("empresa_id", usuario.empresa_id)
      .eq("status", "ativa")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vagas: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { title, area, contract, location, briefing, status } = (await req.json()) as {
      title?: string;
      area?: string;
      contract?: string;
      location?: string;
      briefing?: string;
      status?: string;
    };

    // admin-client: justificado — criação/atualização de vagas com privilégios
    const admin = createSupabaseAdminClient();

    const { data: usuario, error: usuarioError } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .maybeSingle();

    if (usuarioError) {
      return NextResponse.json({ error: usuarioError.message || "Falha ao carregar usuario" }, { status: 500 });
    }

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const { data: empresa, error: empresaError } = await admin
      .from("empresas")
      .select("id")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    if (empresaError) {
      return NextResponse.json({ error: empresaError.message || "Falha ao carregar empresa" }, { status: 500 });
    }

    if (!empresa) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: "Titulo e obrigatorio" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("vagas")
      .insert({
        empresa_id: usuario.empresa_id,
        criado_por: userId,
        title: title.trim(),
        area: area || "Geral",
        tipo_contrato: contract || "CLT",
        localizacao: location || "",
        briefing: briefing || "",
        status: status === "completed" ? "completed" : "ativa",
      })
      .select("id,title,area,tipo_contrato,localizacao,briefing,status,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vaga: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
