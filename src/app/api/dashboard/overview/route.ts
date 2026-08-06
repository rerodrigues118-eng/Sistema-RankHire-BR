import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";

/**
 * GET /api/dashboard/overview
 * Returns gamification checklist, activity chart data (last 30d), and funnel metrics.
 * All data is scoped to the user company via empresa_id – no data leakage.
 */
export async function GET() {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    // Fetch empresa_id for this user
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id, created_at")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }
    const empresaId = usuario.empresa_id;

    // ── Parallel queries ─────────────────────────────────────────────
    const [vagasRes, candidatosRes, agentesRes, buscasRes, empresaRes] = await Promise.all([
      // Check if company has created a vaga
      admin.from("vagas").select("id,created_at,status", { count: "exact" }).eq("empresa_id", empresaId),
      // Candidates (for funnel + activity chart)
      admin.from("pdf_candidates").select("id,status,created_at,vaga_id", { count: "exact" }).eq("empresa_id", empresaId),
      // Agentes IA
      admin.from("agentes_ia").select("id,created_at", { count: "exact" }).eq("empresa_id", empresaId),
      // LinkedIn searches (for "fez primeira busca com IA")
      admin.from("linkedin_search_sessions").select("id", { count: "exact" }).eq("empresa_id", empresaId),
      // Empresa data for profile completion check
      admin.from("empresas").select("nome,logo_url,agents_searches_count,created_at").eq("id", empresaId).single(),
    ]);

    const vagas = vagasRes.data ?? [];
    const candidatos = candidatosRes.data ?? [];
    const agentesCount = agentesRes.count ?? 0;
    const buscasCount = buscasRes.count ?? 0;
    const empresa = empresaRes.data;

    // ── Gamification Checklist ────────────────────────────────────────
    const checklist = [
      {
        id: "perfil_empresa",
        label: "Configurar perfil da empresa",
        done: !!(empresa?.nome && empresa.nome.length > 0),
      },
      {
        id: "primeira_busca",
        label: "Realizar a primeira busca com IA",
        done: buscasCount > 0,
      },
      {
        id: "salvar_candidato",
        label: "Salvar um candidato",
        done: candidatos.length > 0,
      },
      {
        id: "criar_agente",
        label: "Criar um Agente de IA",
        done: agentesCount > 0,
      },
      {
        id: "criar_vaga",
        label: "Criar uma vaga profissional",
        done: vagas.length > 0,
      },
    ];
    const checklistDone = checklist.filter(c => c.done).length;

    // ── Activity Chart: inicia a partir da data de criação da conta (created_at) ─────
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userCreatedAt = usuario?.created_at ? new Date(usuario.created_at) : null;
    const empresaCreatedAt = empresa?.created_at ? new Date(empresa.created_at) : null;
    let creationDate = userCreatedAt || empresaCreatedAt || thirtyDaysAgo;
    if (isNaN(creationDate.getTime())) {
      creationDate = thirtyDaysAgo;
    }

    // Define a data inicial como a data de criacao da conta (ou no maximo 30 dias atras)
    const startDate = creationDate > thirtyDaysAgo ? creationDate : thirtyDaysAgo;
    startDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysCount = Math.max(1, Math.min(30, Math.ceil((now.getTime() - startDate.getTime()) / msPerDay) + 1));

    const activityByDay: Record<string, number> = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * msPerDay);
      const key = d.toISOString().slice(0, 10);
      activityByDay[key] = 0;
    }

    candidatos.forEach(c => {
      if (!c.created_at) return;
      const d = c.created_at.slice(0, 10);
      if (activityByDay[d] !== undefined) activityByDay[d]++;
    });

    const activityChart = Object.entries(activityByDay).map(([date, count]) => ({ date, count }));

    // ── Conversion Funnel ────────────────────────────────────────────
    const statusMap: Record<string, number> = {
      triado: 0,
      contatado: 0,
      entrevistado: 0,
      aprovado: 0,
    };
    candidatos.forEach(c => {
      const s = (c.status || "triado").toLowerCase();
      if (s === "triado" || s === "novo") statusMap.triado++;
      else if (s === "contatado") statusMap.contatado++;
      else if (s === "entrevistado") statusMap.entrevistado++;
      else if (s === "aprovado" || s === "oferta") statusMap.aprovado++;
    });

    const funnel = [
      { stage: "Mapeados", count: candidatos.length },
      { stage: "Contatados", count: statusMap.contatado + statusMap.entrevistado + statusMap.aprovado },
      { stage: "Entrevistados", count: statusMap.entrevistado + statusMap.aprovado },
      { stage: "Aprovados", count: statusMap.aprovado },
    ];

    return NextResponse.json({
      checklist,
      checklistDone,
      checklistTotal: checklist.length,
      activityChart,
      funnel,
      agentesCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
