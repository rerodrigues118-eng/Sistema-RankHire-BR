import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

type VagaSelectRow = {
  id: string;
  title?: string | null;
  titulo?: string | null;
  area?: string | null;
  tipo_contrato?: string | null;
  localizacao?: string | null;
  briefing?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();

    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) return NextResponse.json({ vagas: [] });

    const { data, error } = await supabase
      .from("vagas")
      .select("id,title,titulo,area,tipo_contrato,localizacao,briefing,status,created_at,updated_at")
      .eq("empresa_id", usuario.empresa_id)
      .eq("status", "ativa")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vagas = ((data || []) as VagaSelectRow[]).map((vaga) => ({
      ...vaga,
      title: vaga.title || vaga.titulo || "",
      titulo: vaga.titulo || vaga.title || "",
    }));

    return NextResponse.json({ vagas });
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

    // Verificar limite de vagas do plano (Trial max 3 vagas)
    const { data: empresaPlan } = await admin
      .from("empresas")
      .select("plano, subscription_status")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    const plan = (empresaPlan?.plano || "trial").toLowerCase();
    const isTrial = plan === "trial" || empresaPlan?.subscription_status === "trialing";

    if (isTrial) {
      const { count: jobCount } = await admin
        .from("vagas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", usuario.empresa_id);

      if (jobCount !== null && jobCount >= 3) {
        return NextResponse.json(
          { error: "Seu plano Trial permite criar no máximo 3 vagas. Faça o upgrade do seu plano para criar mais vagas." },
          { status: 403 }
        );
      }
    }

    const { data, error } = await admin
      .from("vagas")
      .insert({
        empresa_id: usuario.empresa_id,
        criado_por: userId,
        titulo: title.trim(),
        title: title.trim(),
        area: area || "Geral",
        tipo_contrato: contract || "CLT",
        localizacao: location || "",
        briefing: briefing || "",
        status: status === "completed" ? "completed" : "ativa",
      })
      .select("id,title,titulo,area,tipo_contrato,localizacao,briefing,status,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vaga: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
