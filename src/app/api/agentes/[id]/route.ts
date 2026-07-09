import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Agent } from "@/lib/types";

type AgentRow = {
  id: string;
  empresa_id: string;
  vaga_id: string;
  nome: string;
  briefing: string | null;
  status: Agent["status"];
  frequencia: Agent["frequencia"];
  score_minimo_notificacao: number | string | null;
  calibracoes_realizadas: number | null;
  ultima_busca: string | null;
  proxima_busca: string | null;
  created_at: string | null;
  criterios_ia: unknown;
  filtros_ia: unknown;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();
    const { id } = await params;

    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const { data: agente, error } = await admin
      .from("agentes_ia")
      .select("id,empresa_id,vaga_id,nome,briefing,status,frequencia,score_minimo_notificacao,calibracoes_realizadas,ultima_busca,proxima_busca,created_at,criterios_ia,filtros_ia")
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (error || !agente) {
      return NextResponse.json({ error: "Agente nao encontrado" }, { status: 404 });
    }

    const [runsRes, candidatesRes, calibracoesRes, vagaRes] = await Promise.all([
      admin
        .from("agente_runs")
        .select("id,agente_id,perfis_analisados,candidatos_encontrados,candidatos_score_alto,status,executado_em")
        .eq("agente_id", id)
        .order("executado_em", { ascending: false }),
      admin
        .from("agente_candidatos")
        .select("id,agente_id,linkedin_url,dados_perfil,score_final,criterios_avaliacao,visto,status,descoberto_em")
        .eq("agente_id", id)
        .order("descoberto_em", { ascending: false }),
      admin
        .from("agente_calibracoes")
        .select("id,agente_id,linkedin_url,dados_perfil,decisao,created_at")
        .eq("agente_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
      admin.from("vagas").select("id,titulo").eq('empresa_id', usuario.empresa_id).eq("id", (agente as AgentRow).vaga_id).single(),
    ]);

    if (runsRes.error) {
      return NextResponse.json({ error: runsRes.error.message }, { status: 500 });
    }

    if (candidatesRes.error) {
      return NextResponse.json({ error: candidatesRes.error.message }, { status: 500 });
    }

    if (calibracoesRes.error) {
      return NextResponse.json({ error: calibracoesRes.error.message }, { status: 500 });
    }

    if (vagaRes.error) {
      return NextResponse.json({ error: vagaRes.error.message }, { status: 500 });
    }

    const agenteFormatado = {
      id: (agente as AgentRow).id,
      empresaId: (agente as AgentRow).empresa_id,
      vagaId: (agente as AgentRow).vaga_id,
      nome: (agente as AgentRow).nome,
      briefing: (agente as AgentRow).briefing || "",
      status: (agente as AgentRow).status,
      frequencia: (agente as AgentRow).frequencia,
      scoreMinimoNotificacao: Number((agente as AgentRow).score_minimo_notificacao ?? 4),
      calibracoesRealizadas: Number((agente as AgentRow).calibracoes_realizadas ?? 0),
      ultimaBusca: (agente as AgentRow).ultima_busca,
      proximaBusca: (agente as AgentRow).proxima_busca,
      createdAt: (agente as AgentRow).created_at || new Date().toISOString(),
      vagaTitulo: vagaRes.data?.titulo || "Vaga vinculada",
      criteriosIa: (agente as AgentRow).criterios_ia || [],
      filtrosIa: (agente as AgentRow).filtros_ia || undefined,
    } as Agent;

    return NextResponse.json({
      agente: agenteFormatado,
      runs: runsRes.data || [],
      candidatos: candidatesRes.data || [],
      calibracoes: calibracoesRes.data || [],
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();
    const { id } = await params;
    const body = (await req.json()) as Partial<{
      status: Agent["status"];
      frequencia: Agent["frequencia"];
      scoreMinimoNotificacao: number;
      calibracoesRealizadas: number;
      ultimaBusca: string | null;
      proximaBusca: string | null;
      briefing: string;
      nome: string;
      criteriosIa: unknown;
      filtrosIa: unknown;
    }>;

    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.frequencia) update.frequencia = body.frequencia;
    if (typeof body.scoreMinimoNotificacao === "number") update.score_minimo_notificacao = body.scoreMinimoNotificacao;
    if (typeof body.calibracoesRealizadas === "number") update.calibracoes_realizadas = body.calibracoesRealizadas;
    if (typeof body.ultimaBusca !== "undefined") update.ultima_busca = body.ultimaBusca;
    if (typeof body.proximaBusca !== "undefined") update.proxima_busca = body.proximaBusca;
    if (body.briefing) update.briefing = body.briefing;
    if (body.nome) update.nome = body.nome;
    if (typeof body.criteriosIa !== "undefined") update.criterios_ia = body.criteriosIa;
    if (typeof body.filtrosIa !== "undefined") update.filtros_ia = body.filtrosIa;

    const { data, error } = await admin
      .from("agentes_ia")
      .update(update)
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id)
      .select("id,empresa_id,vaga_id,nome,briefing,status,frequencia,score_minimo_notificacao,calibracoes_realizadas,ultima_busca,proxima_busca,created_at,criterios_ia,filtros_ia")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      agente: {
        id: data.id,
        empresaId: data.empresa_id,
        vagaId: data.vaga_id,
        nome: data.nome,
        briefing: data.briefing || "",
        status: data.status,
        frequencia: data.frequencia,
        scoreMinimoNotificacao: Number(data.score_minimo_notificacao ?? 4),
        calibracoesRealizadas: Number(data.calibracoes_realizadas ?? 0),
        ultimaBusca: data.ultima_busca,
        proximaBusca: data.proxima_busca,
        createdAt: data.created_at || new Date().toISOString(),
        criteriosIa: data.criterios_ia || [],
        filtrosIa: data.filtros_ia || undefined,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
