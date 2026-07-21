import { handleApiError } from "@/lib/api";
import { callAI } from "@/lib/ai-client";
import { requireAuth } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";
import type { Agent, AgentCriterion, AgentFilterSet, AgentRun, AgentCandidate } from "@/lib/types";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type VagaRow = {
  id: string;
  title: string | null;
};

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
  criterios_ia: AgentCriterion[] | null;
  filtros_ia: AgentFilterSet | null;
};

type RunRow = {
  id: string;
  agente_id: string;
  perfis_analisados: number | null;
  candidatos_encontrados: number | null;
  candidatos_score_alto: number | null;
  status: AgentRun["status"] | null;
  executado_em: string | null;
};

type CandidateRow = {
  id: string;
  agente_id: string;
  linkedin_url: string;
  dados_perfil: Record<string, unknown> | null;
  score_final: number | string | null;
  criterios_avaliacao: AgentCriterion[] | null;
  visto: boolean | null;
  status: AgentCandidate["status"] | null;
  descoberto_em: string | null;
};

function fallbackCriteria(briefing?: string | null): AgentCriterion[] {
  const text = (briefing || "").toLowerCase();
  const criteria: AgentCriterion[] = [
    {
      nome: "Experiencia relevante",
      peso: 5,
      descricao: "Tempo e aderencia ao cargo alvo.",
    },
    {
      nome: "Hard skills prioritarias",
      peso: 5,
      descricao: "Ferramentas e conhecimentos citados no briefing.",
    },
    {
      nome: "Senioridade",
      peso: 4,
      descricao: "Nivel de maturidade esperada para a vaga.",
    },
    {
      nome: "Contexto de produto",
      peso: 3,
      descricao: "Experiencia com o tipo de empresa e ambiente descritos.",
    },
  ];

  if (text.includes("figma") || text.includes("design")) {
    criteria.unshift({
      nome: "Design visual e Figma",
      peso: 5,
      descricao: "Profundidade em layout, prototipacao e execucao visual.",
    });
  }

  if (text.includes("html") || text.includes("css") || text.includes("email")) {
    criteria.push({
      nome: "HTML/CSS para email",
      peso: 4,
      descricao: "Capacidade de codificar templates e campanhas.",
    });
  }

  if (text.includes("crm") || text.includes("hubspot") || text.includes("salesforce")) {
    criteria.push({
      nome: "CRM e automacao",
      peso: 4,
      descricao: "Vivencia com processos, automacoes e funis.",
    });
  }

  return criteria.slice(0, 5);
}

function fallbackFilters(briefing?: string | null, vagaTitulo?: string | null): AgentFilterSet {
  const title = vagaTitulo || "vaga";
  const text = (briefing || "").toLowerCase();
  return {
    job_titles: [title],
    localizacao: text.includes("remoto") ? "Remoto" : "Brasil",
    experiencia_minima: text.includes("senior") ? 5 : text.includes("pleno") ? 3 : 2,
    experiencia_maxima: text.includes("senior") ? 12 : 8,
    keywords: Array.from(
      new Set(
        [title, ...(briefing || "").split(/[,.;\n]/g)]
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6)
      )
    ),
  };
}

function formatAgent(
  row: AgentRow,
  vagaTitulo: string | null,
  runs: RunRow[],
  candidates: CandidateRow[],
): Agent {
  const agentRuns = runs.filter((run) => run.agente_id === row.id);
  const agentCandidates = candidates.filter((candidate) => candidate.agente_id === row.id);
  const latestRun = agentRuns[0];
  const shortlisted = agentCandidates.filter((candidate) => candidate.status === "shortlist").length;
  const weekly = agentRuns
    .filter((run) => {
      const executedAt = run.executado_em ? new Date(run.executado_em).getTime() : 0;
      return executedAt >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    })
    .reduce(
      (acc, run) => ({
        perfisAnalisados: acc.perfisAnalisados + Number(run.perfis_analisados || 0),
        candidatosEncontrados: acc.candidatosEncontrados + Number(run.candidatos_encontrados || 0),
        candidatosScoreAlto: acc.candidatosScoreAlto + Number(run.candidatos_score_alto || 0),
        shortlist: acc.shortlist,
      }),
      {
        perfisAnalisados: 0,
        candidatosEncontrados: 0,
        candidatosScoreAlto: 0,
        shortlist: 0,
      },
    );

  return {
    id: row.id,
    empresaId: row.empresa_id,
    vagaId: row.vaga_id,
    nome: row.nome,
    briefing: row.briefing || "",
    status: row.status,
    frequencia: row.frequencia,
    scoreMinimoNotificacao: Number(row.score_minimo_notificacao || 4),
    calibracoesRealizadas: Number(row.calibracoes_realizadas || 0),
    ultimaBusca: row.ultima_busca,
    proximaBusca: row.proxima_busca,
    createdAt: row.created_at || new Date().toISOString(),
    vagaTitulo: vagaTitulo || "Vaga vinculada",
    criteriosIa: row.criterios_ia || [],
    filtrosIa: row.filtros_ia || undefined,
    metrics: {
      analisados: weekly.perfisAnalisados,
      encontrados: weekly.candidatosEncontrados || agentCandidates.length,
      scoreAlto: weekly.candidatosScoreAlto || agentCandidates.filter((candidate) => Number(candidate.score_final || 0) >= 4).length,
      pipeline: weekly.shortlist || shortlisted,
    },
    latestRun: latestRun
      ? {
          id: latestRun.id,
          agenteId: latestRun.agente_id,
          perfisAnalisados: Number(latestRun.perfis_analisados || 0),
          candidatosEncontrados: Number(latestRun.candidatos_encontrados || 0),
          candidatosScoreAlto: Number(latestRun.candidatos_score_alto || 0),
          status: latestRun.status || "concluido",
          executadoEm: latestRun.executado_em || new Date().toISOString(),
        }
      : null,
  };
}

export async function GET() {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    // admin-client: justificado — operação server-side que requer service-role
    const admin = createSupabaseAdminClient();
    // admin-client: justified — listing agents and related cross-table data
    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ agentes: [], vagas: [], candidatos: [], runs: [], notificacoes: [] });
    }

    const [vagasRes, agentesRes] = await Promise.all([
      admin.from("vagas").select("id,title").eq("empresa_id", usuario.empresa_id).order("created_at", { ascending: false }),
      admin
        .from("agentes_ia")
        .select("id,empresa_id,vaga_id,nome,briefing,status,frequencia,score_minimo_notificacao,calibracoes_realizadas,ultima_busca,proxima_busca,created_at,criterios_ia,filtros_ia")
        .eq("empresa_id", usuario.empresa_id)
        .order("created_at", { ascending: false }),
    ]);

    if (vagasRes.error) {
      logger.error('[agentes] vagasRes.error:', vagasRes.error);
      return NextResponse.json({ 
        error: `Erro ao buscar vagas: ${vagasRes.error.message}`,
        code: vagasRes.error.code 
      }, { status: 500 });
    }

    if (agentesRes.error) {
      // Handle missing table gracefully
      const err = agentesRes.error;
      const isMissing = err.code === "42P01" || err.message?.includes("does not exist") || err.message?.includes("relation");
      if (isMissing) {
        return NextResponse.json({ agentes: [], vagas: [], candidatos: [], runs: [], notificacoes: [] });
      }
      logger.error('[agentes] agentesRes.error:', agentesRes.error);
      return NextResponse.json({ 
        error: `Erro ao buscar agentes: ${agentesRes.error.message}`,
        code: agentesRes.error.code 
      }, { status: 500 });
    }

    const agentes = (agentesRes.data || []) as AgentRow[];
    const agentIds = agentes.map((agent) => agent.id);

    const [runsRes, candidatesRes] = agentIds.length
      ? await Promise.all([
          admin
            .from("agente_runs")
            .select("id,agente_id,perfis_analisados,candidatos_encontrados,candidatos_score_alto,status,executado_em")
            .in("agente_id", agentIds)
            .order("executado_em", { ascending: false }),
          admin
            .from("agente_candidatos")
            .select("id,agente_id,linkedin_url,dados_perfil,score_final,criterios_avaliacao,visto,status,descoberto_em")
            .in("agente_id", agentIds)
            .order("descoberto_em", { ascending: false }),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];

    // Handle missing tables gracefully (tables may not exist yet)
    const runsError = runsRes.error;
    const candidatesError = candidatesRes.error;
    const isTableMissing = (err: { message?: string; code?: string } | null) =>
      err?.code === "42P01" || err?.message?.includes("does not exist") || err?.message?.includes("relation");

    const runs = (runsError && isTableMissing(runsError)) ? [] : (runsRes.data || []) as RunRow[];
    const candidates = (candidatesError && isTableMissing(candidatesError)) ? [] : (candidatesRes.data || []) as CandidateRow[];

    if (runsError && !isTableMissing(runsError)) {
      return NextResponse.json({ error: runsError.message }, { status: 500 });
    }

    if (candidatesError && !isTableMissing(candidatesError)) {
      return NextResponse.json({ error: candidatesError.message }, { status: 500 });
    }

    const vagas = (vagasRes.data || []) as VagaRow[];
    const vagasMap = new Map(vagas.map((vaga) => [vaga.id, vaga.title || "Vaga vinculada"]));

    const formattedAgents = agentes.map((agent) => formatAgent(agent, vagasMap.get(agent.vaga_id) || null, runs, candidates));
    const formattedCandidates = candidates.map((candidate, index) => {
      const perfil = candidate.dados_perfil || {};
      const nome = String(perfil.nome || perfil.name || `Candidato ${index + 1}`);
      const cargo = String(perfil.cargo || perfil.title || perfil.role || "Cargo nao informado");
      const empresa = String(perfil.empresa || perfil.company || "Empresa nao informada");
      const cidade = String(perfil.cidade || perfil.location || "Brasil");
      const skills = Array.isArray(perfil.skills) ? perfil.skills.map(String).slice(0, 4) : [];
      const criteria = candidate.criterios_avaliacao || [];
      const initials = nome
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      return {
        id: candidate.id,
        agenteId: candidate.agente_id,
        linkedinUrl: candidate.linkedin_url,
        scoreFinal: Number(candidate.score_final || 0),
        visto: Boolean(candidate.visto),
        status: candidate.status || "novo",
        descobertoEm: candidate.descoberto_em || new Date().toISOString(),
        nome,
        cargo,
        empresa,
        cidade,
        skills,
        chips: skills,
        avatarColor: String(perfil.avatarColor || "#1B4FD8"),
        initials,
        criteriosAvaliacao: criteria,
      } satisfies AgentCandidate;
    });

    const notifications = formattedCandidates
      .filter((candidate) => candidate.scoreFinal >= 4)
      .slice(0, 8)
      .map((candidate) => ({
        id: candidate.id,
        agenteId: candidate.agenteId,
        title: `${candidate.nome} passou do limite`,
        description: `${candidate.cargo} em ${candidate.empresa} atingiu score ${candidate.scoreFinal.toFixed(1)}.`,
        channel: candidate.visto ? "email" : "sino",
        createdAt: candidate.descobertoEm,
        unread: !candidate.visto,
      }));

    return NextResponse.json({
      vagas,
      agentes: formattedAgents,
      candidatos: formattedCandidates,
      runs,
      notificacoes: notifications,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    // admin-client: justificado — operação server-side que requer service-role
    const admin = createSupabaseAdminClient();
    const body = (await req.json()) as {
      nome?: string;
      vagaId?: string;
      briefing?: string;
      frequencia?: Agent["frequencia"];
      scoreMinimoNotificacao?: number;
    };

    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    if (!body.nome?.trim() || !body.vagaId || !body.briefing?.trim()) {
      return NextResponse.json({ error: "Nome, vaga e briefing sao obrigatorios" }, { status: 400 });
    }

    const { data: vaga } = await admin
      .from("vagas")
      .select("id,title")
      .eq("id", body.vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!vaga?.id) {
      return NextResponse.json({ error: "Vaga nao encontrada" }, { status: 404 });
    }

    let criterios: AgentCriterion[] = fallbackCriteria(body.briefing);
    let filtros: AgentFilterSet = fallbackFilters(body.briefing, vaga.title);

    try {
      const systemPrompt =
        "Voce e um estrategista de recrutamento. Gere criterios e filtros em JSON valido, sem markdown e sem texto extra.";
      const userPrompt = `Crie criterios e filtros para este agente virtual:
Nome do agente: ${body.nome}
Vaga: ${vaga.title || "Vaga"}
Briefing: ${body.briefing}

Retorne exatamente este JSON:
{
  "criterios": [
    { "nome": "string", "peso": 1, "descricao": "string" }
  ],
  "filtros_sugeridos": {
    "job_titles": ["string"],
    "localizacao": "string",
    "experiencia_minima": 2,
    "experiencia_maxima": 8,
    "keywords": ["string"]
  }
}`;

      const raw = await callAI(userPrompt, systemPrompt, process.env.GROQ_MODEL_CRITERIA || "llama-3.3-70b-versatile");
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse((match ? match[0] : raw) as string) as {
        criterios?: AgentCriterion[];
        filtros_sugeridos?: AgentFilterSet;
      };

      if (Array.isArray(parsed.criterios) && parsed.criterios.length > 0) {
        criterios = parsed.criterios.slice(0, 5).map((criterio) => ({
          nome: criterio.nome,
          peso: Number(criterio.peso || 3),
          descricao: criterio.descricao || "",
        }));
      }

      if (parsed.filtros_sugeridos) {
        filtros = parsed.filtros_sugeridos;
      }
    } catch {
      // Fallback heuristico ja preparado acima.
    }

    const { data: agente, error: agentError } = await admin
      .from("agentes_ia")
      .insert({
        empresa_id: usuario.empresa_id,
        vaga_id: body.vagaId,
        nome: body.nome.trim(),
        briefing: body.briefing.trim(),
        status: "ativo",
        frequencia: body.frequencia || "diaria",
        score_minimo_notificacao: body.scoreMinimoNotificacao || 4.0,
        criterios_ia: criterios,
        filtros_ia: filtros,
        calibracoes_realizadas: 0,
      })
      .select("id,empresa_id,vaga_id,nome,briefing,status,frequencia,score_minimo_notificacao,calibracoes_realizadas,ultima_busca,proxima_busca,created_at,criterios_ia,filtros_ia")
      .single();

    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    const agenteCriado: Agent = {
      id: (agente as AgentRow).id,
      empresaId: (agente as AgentRow).empresa_id,
      vagaId: (agente as AgentRow).vaga_id,
      nome: (agente as AgentRow).nome,
      briefing: (agente as AgentRow).briefing || "",
      status: (agente as AgentRow).status || "ativo",
      frequencia: (agente as AgentRow).frequencia || "diaria",
      scoreMinimoNotificacao: Number((agente as AgentRow).score_minimo_notificacao ?? body.scoreMinimoNotificacao ?? 4),
      calibracoesRealizadas: Number((agente as AgentRow).calibracoes_realizadas ?? 0),
      ultimaBusca: (agente as AgentRow).ultima_busca,
      proximaBusca: (agente as AgentRow).proxima_busca,
      createdAt: (agente as AgentRow).created_at || new Date().toISOString(),
      vagaTitulo: vaga.title || "Vaga vinculada",
      criteriosIa: criterios,
      filtrosIa: filtros,
    };

    return NextResponse.json({
      agente: agenteCriado,
      criterios,
      filtros,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
