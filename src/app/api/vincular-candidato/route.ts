import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

/**
 * POST /api/vincular-candidato
 * Vincula um candidato do linkedin_profiles a uma vaga específica.
 * Bloqueado no plano trial — apenas planos pagos podem vincular.
 *
 * Body: { linkedin_url: string, vaga_id: string }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // ── Verifica plano (trial não pode vincular) ────────────────────
    const { data: empresa } = await admin
      .from("empresas")
      .select("plano, subscription_status")
      .eq("id", usuario.empresa_id)
      .single();

    const userRole = (usuario.role || "").toLowerCase();
    const isAdmin = userRole === "admin" || userRole === "superadmin";
    const isTrial =
      !isAdmin &&
      (empresa?.plano === "trial" ||
        empresa?.plano === "trial_starter" ||
        empresa?.subscription_status === "trialing");

    if (isTrial) {
      return NextResponse.json(
        {
          error: "Vinculação de candidatos a vagas está disponível apenas nos planos pagos.",
          code: "TRIAL_RESTRICTION",
          upgrade_message: "Faça upgrade para vincular candidatos a vagas e acessar o CRM completo.",
        },
        { status: 402 }
      );
    }

    // ── Valida input ────────────────────────────────────────────────
    const body = (await req.json()) as { linkedin_url?: string; vaga_id?: string };

    if (!body.linkedin_url || !body.vaga_id) {
      return NextResponse.json(
        { error: "linkedin_url e vaga_id são obrigatórios" },
        { status: 400 }
      );
    }

    // ── Verifica se a vaga pertence à empresa ───────────────────────
    const { data: vaga } = await admin
      .from("vagas")
      .select("id, empresa_id, title")
      .eq("id", body.vaga_id)
      .single();

    if (!vaga || vaga.empresa_id !== usuario.empresa_id) {
      return NextResponse.json({ error: "Vaga não encontrada ou não pertence à sua empresa" }, { status: 404 });
    }

    // ── Busca o perfil no linkedin_profiles ─────────────────────────
    const { data: perfil } = await admin
      .from("linkedin_profiles")
      .select("*")
      .eq("linkedin_url", body.linkedin_url)
      .single();

    if (!perfil) {
      return NextResponse.json(
        { error: "Perfil do LinkedIn não encontrado no banco. Execute uma busca primeiro." },
        { status: 404 }
      );
    }

    // ── Cria entrada no pipeline_entries ────────────────────────────
    const { data: pipelineEntry, error: pipelineError } = await admin
      .from("pipeline_entries")
      .insert({
        vaga_id: body.vaga_id,
        empresa_id: usuario.empresa_id,
        candidato_nome: perfil.nome || "Sem nome",
        candidato_email: null,
        status: "triagem",
        notas: `Vinculado via Busca Inteligente\nLinkedIn: ${perfil.linkedin_url}\nCargo: ${perfil.cargo_atual || "N/A"}\nEmpresa: ${perfil.empresa_atual || "N/A"}`,
        dados_extras: {
          linkedin_url: perfil.linkedin_url,
          cargo_atual: perfil.cargo_atual,
          empresa_atual: perfil.empresa_atual,
          cidade: perfil.cidade,
          skills: perfil.skills,
        },
      })
      .select("id")
      .single();

    if (pipelineError) {
      logger.error("[vincular-candidato] Erro ao criar pipeline entry", { error: pipelineError.message });
      return NextResponse.json({ error: "Erro ao vincular candidato" }, { status: 500 });
    }

    // ── Marca como visto em perfis_vistos ───────────────────────────
    await admin.from("perfis_vistos").upsert(
      {
        empresa_id: usuario.empresa_id,
        linkedin_url: body.linkedin_url,
        visto_em: new Date().toISOString(),
      },
      { onConflict: "empresa_id,linkedin_url" }
    );

    return NextResponse.json({
      success: true,
      pipeline_entry_id: pipelineEntry.id,
      message: `Candidato vinculado à vaga "${vaga.title}" com sucesso.`,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
