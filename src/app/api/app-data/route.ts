import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";

type JobRow = {
  id: string;
  titulo: string | null;
  area: string | null;
  status: string | null;
  created_at: string | null;
};

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    // Use authenticated supabase for initial user lookup; admin retained for privileged ops
    const admin = createSupabaseAdminClient();
    const { data: usuario } = await supabase.from("usuarios").select("empresa_id, role").eq("id", userId).single();

    const empresaId = usuario?.empresa_id;
    const userRole = usuario?.role || "member";

    if (!empresaId) {
      // If the user has no associated company, return an empty app-data payload.
      // Avoid auto-creating demo companies or inserting mock jobs.
      return NextResponse.json({
        empresa: null,
        jobs: [],
        candidates: [],
        quota: null,
        dashboardSummary: {
          totalCandidates: 0,
          shortlistedCandidates: 0,
          averageCandidateScore: 0,
          activeJobs: 0,
          scoreHigh: 0,
        },
        recentActivities: [],
        analytics: {
          scoreDistribution: [],
          usageItems: [],
          funnel: {
            analisados: 0,
            filtros: 0,
            scoreHigh: 0,
            shortlist: 0,
            contatados: 0,
            contratados: 0,
          },
        },
      });
    }

    // 3. Garantir que a vaga padrão e seus critérios existam associados a essa empresa
    if (empresaId) {
      const defaultJobId = "e5d53686-b8b6-4ec6-b8c2-71cd534641fb";
      
      const { data: defaultJobExists } = await admin
        .from("vagas")
        .select("id")
        .eq("id", defaultJobId)
        .single();

      if (defaultJobExists) {
        // Atualiza a vaga para pertencer a essa empresa e usuário
        await admin
          .from("vagas")
          .update({
            empresa_id: empresaId,
            criado_por: userId,
            titulo: "Email Designer BR — Figma",
            title: "Email Designer BR — Figma",
            area: "Design",
            tipo_contrato: "CLT",
            localizacao: "São Paulo, SP",
            briefing: "Buscamos um designer focado em email marketing e Figma.",
            status: "ativa"
          })
          .eq("id", defaultJobId);
      } else {
        // Insere a vaga associada à empresa
        await admin
          .from("vagas")
          .insert({
            id: defaultJobId,
            empresa_id: empresaId,
            criado_por: userId,
            titulo: "Email Designer BR — Figma",
            title: "Email Designer BR — Figma",
            area: "Design",
            tipo_contrato: "CLT",
            localizacao: "São Paulo, SP",
            briefing: "Buscamos um designer focado em email marketing e Figma.",
            status: "ativa"
          });
      }

      // 4. Garantir critérios básicos da vaga padrão
      const { data: defaultCriteria } = await admin
        .from("criteria")
        .select("id")
        .eq("vaga_id", defaultJobId);

      if (!defaultCriteria || defaultCriteria.length === 0) {
        const criteriaToInsert = [
          { vaga_id: defaultJobId, nome: "Experiência com Design de Email Marketing", peso: 5, gerado_por_ia: false },
          { vaga_id: defaultJobId, nome: "Domínio de Figma", peso: 4, gerado_por_ia: false },
          { vaga_id: defaultJobId, nome: "HTML/CSS básico", peso: 3, gerado_por_ia: false },
        ];
        await admin.from("criteria").insert(criteriaToInsert);
      }

      // 5. Atualiza todos os pdf_candidates órfãos para a empresa dele, se houver
      await admin
        .from("pdf_candidates")
        .update({ empresa_id: empresaId })
        .eq("vaga_id", defaultJobId)
        .is("empresa_id", null);

      // 6. Atualiza todos os pdf_batches órfãos
      await admin
        .from("pdf_batches")
        .update({ empresa_id: empresaId })
        .eq("vaga_id", defaultJobId)
        .is("empresa_id", null);
    }

    const [jobsRes, candidatesRes, empresaRes] = await Promise.all([
      supabase
        .from("vagas")
        .select("id,titulo,area,status,created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false }),
      supabase
        .from("pdf_candidates")
        .select(`
          id,
          vaga_id,
          nome_candidato,
          cargo_atual,
          empresa_atual,
          cidade,
          email_contato,
          telefone,
          score_final,
          linkedin_url,
          status,
          parsed_text,
          observacoes,
          shortlist,
          pretensao_salarial,
          disponibilidade,
          regime_preferido,
          resumo_ia,
          created_at,
          candidate_etiquetas(
            etiquetas(id,nome,cor,posicao)
          ),
          candidate_evaluations!candidate_id(
            nota,
            nota_manual,
            justificativa,
            criteria(nome, peso)
          )
        `)
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false }),
      supabase
        .from("empresas")
        .select("id,nome,plano,status,trial_expires_at,subscription_status,current_period_end,limite_pdfs_mes")
        .eq("id", empresaId)
        .single(),
    ]);

    if (jobsRes.error) {
      return NextResponse.json({ error: jobsRes.error.message }, { status: 500 });
    }

    if (candidatesRes.error) {
      return NextResponse.json({ error: candidatesRes.error.message }, { status: 500 });
    }

    const allCandidates = (candidatesRes.data || []) as Array<Record<string, unknown>>;
    const AVATAR_PALETTE = ["#0369A1","#D97706","#059669","#7E22CE","#BE185D","#0891B2","#4338CA","#B45309"];

    const normalizeJobStatus = (status: string | null) => {
      const value = (status || "").toLowerCase();
      if (["completed", "encerrada", "fechada", "finalizada"].includes(value)) return "completed" as const;
      if (["paused", "pausada", "pause"].includes(value)) return "paused" as const;
      return "active" as const;
    };

    const jobs = ((jobsRes.data || []) as JobRow[]).map((job) => {
      const jobCandidates = allCandidates.filter((cand) => (cand.vaga_id as string) === job.id);
      const jobScoredCandidates = jobCandidates.filter((cand) => (cand.score_final as number | null) !== null && (cand.score_final as number) > 0);
      const jobAvgScoreValue = jobScoredCandidates.length > 0
        ? jobScoredCandidates.reduce((sum: number, cand: Record<string, unknown>) => sum + Number(cand.score_final), 0) / jobScoredCandidates.length
        : 0;
      const jobTopScoreValue = jobScoredCandidates.length > 0
        ? Math.max(...jobScoredCandidates.map((cand: Record<string, unknown>) => Number(cand.score_final)))
        : 0;

      return {
        id: job.id,
        title: job.titulo || "Vaga sem titulo",
        department: job.area || "Geral",
        candidatesCount: jobCandidates.length,
        averageScore: Math.round(jobAvgScoreValue * 10) / 10,
        topScore: Math.round(jobTopScoreValue * 10) / 10,
        status: normalizeJobStatus(job.status),
        createdDate: job.created_at ? new Date(job.created_at).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
        createdAt: job.created_at || undefined,
      };
    });

    const candidates = allCandidates.map((cand: Record<string, unknown>, index: number) => {
      const candEvals = (cand.candidate_evaluations as Array<Record<string, unknown>> | undefined) || [];
      const formattedEvals = candEvals.map((e: Record<string, unknown>) => {
        const criteria = e.criteria as Record<string, unknown> | undefined;
        return {
          name: (criteria?.nome as string | undefined) || "Critério",
          score: e.nota,
          manualScore: e.nota_manual,
          justification: (e.justificativa as string | undefined) || "",
          weight: (criteria?.peso as number | undefined) || 1,
        };
      });

      // Build confirmedTags from high-scoring evaluations (nota >= 4.0)
      const confirmedTags = formattedEvals
        .filter((e: Record<string, unknown>) => {
          const manualScore = e.manualScore as number | undefined;
          const score = e.score as number | undefined;
          return ((manualScore ?? score) ?? 0) >= 4.0 && e.name && e.name !== "Critério";
        })
        .map((e: Record<string, unknown>) => e.name as string);

      // Build partialTags from medium-scoring evaluations (nota >= 2.5 and < 4.0)
      const partialTags = formattedEvals
        .filter((e: Record<string, unknown>) => {
          const manualScore = e.manualScore as number | undefined;
          const score = e.score as number | undefined;
          const evalScore = (manualScore ?? score) ?? 0;
          return evalScore >= 2.5 && evalScore < 4.0 && e.name && e.name !== "Critério";
        })
        .map((e: Record<string, unknown>) => e.name as string);

      const avatarColor = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
      const candidateName = (cand.nome_candidato as string | null) || `Candidato ${index + 1}`;
      const candEtiquetas = cand.candidate_etiquetas as Array<Record<string, unknown>> | undefined;
      const etiqueta = candEtiquetas?.[0] ? (candEtiquetas[0].etiquetas as string | null) : null;

      return {
        id: cand.id,
        name: candidateName,
        role: (cand.cargo_atual as string | null) || "Email Designer",
        company: (cand.empresa_atual as string | null) || "Via upload",
        city: (cand.cidade as string | null) || "Brasil",
        vagaId: (cand.vaga_id as string | null) || undefined,
        email: (cand.email_contato as string | null) || "",
        phone: (cand.telefone as string | null) || "",
        score: Number(cand.score_final || 0),
        avatarColor,
        initials: candidateName
          .split(" ")
          .filter((n: string) => n.length > 0)
          .slice(0, 2)
          .map((n: string) => n[0].toUpperCase())
          .join(""),
        confirmedTags,
        partialTags,
        otherTags: [],
        etiqueta,
        shortlist: cand.shortlist || false,
        status: (["oferecido", "contratado", "entrevista", "shortlist"] as string[]).includes(cand.status as string)
          ? (cand.status as string)
          : "triado",
        linkedinUrl: cand.linkedin_url || "#",
        parsedText: cand.parsed_text || undefined,
        observacoes: cand.observacoes || "",
        evaluations: formattedEvals,
        pretensaoSalarial: cand.pretensao_salarial || "",
        disponibilidade: cand.disponibilidade || "",
        regime: cand.regime_preferido || "",
        aiSummary: cand.resumo_ia || "",
        createdAt: cand.created_at || undefined,
      };
    });

    const recentActivities = [
      ...jobs
        .filter((job) => job.createdAt)
        .map((job) => ({
          id: `job-${job.id}`,
          text: `Vaga ${job.title} criada`,
          time: new Date(job.createdAt as string).getTime(),
          displayTime: job.createdDate,
          type: "create" as const,
        })),
      ...candidates
        .filter((candidate) => candidate.createdAt)
        .map((candidate) => ({
          id: `cand-${candidate.id}`,
          text: `${candidate.name} recebeu score ${candidate.score.toFixed(1)}`,
          time: new Date(candidate.createdAt as string).getTime(),
          displayTime: new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(candidate.createdAt as string)),
          type: candidate.shortlist ? ("update" as const) : ("info" as const),
        })),
    ]
      .sort((a, b) => b.time - a.time)
      .slice(0, 6)
      .map(({ displayTime, ...item }) => ({
        ...item,
        time: displayTime,
      }));

    const totalCandidates = candidates.length;
    const shortlistedCandidates = candidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
    const highScoreCandidates = candidates.filter((candidate) => candidate.score >= 4.0).length;
    const scoreBase = candidates.filter((candidate) => candidate.score > 0);
    const averageCandidateScore = scoreBase.length > 0
      ? scoreBase.reduce((sum, candidate) => sum + candidate.score, 0) / scoreBase.length
      : 0;

    const scoreDistribution = [
      { range: "4.5 – 5.0", label: "Excelente", count: candidates.filter((candidate) => candidate.score >= 4.5).length, color: "#06D6A0" },
      { range: "3.5 – 4.4", label: "Adequado", count: candidates.filter((candidate) => candidate.score >= 3.5 && candidate.score < 4.5).length, color: "#1B4FD8" },
      { range: "2.5 – 3.4", label: "Parcial", count: candidates.filter((candidate) => candidate.score >= 2.5 && candidate.score < 3.5).length, color: "#D4AF37" },
      { range: "< 2.5", label: "Baixa aderência", count: candidates.filter((candidate) => candidate.score > 0 && candidate.score < 2.5).length, color: "#CBD5E1" },
    ].map((item) => ({
      ...item,
      percent: totalCandidates > 0 ? Math.round((item.count / totalCandidates) * 100) : 0,
    }));

    const usageItems = [
      { label: "Candidatos analisados", value: totalCandidates.toString() },
      { label: "Vagas ativas", value: jobs.filter((job) => job.status === "active").length.toString() },
      { label: "Score 4.0+", value: highScoreCandidates.toString() },
      { label: "Shortlist", value: shortlistedCandidates.toString() },
    ];

    const dashboardSummary = {
      totalCandidates,
      shortlistedCandidates,
      averageCandidateScore: Math.round(averageCandidateScore * 10) / 10,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      scoreHigh: highScoreCandidates,
    };

    // Monthly PDF processing count for quota
    let processedPdfCount = 0;
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { count, error: countErr } = await admin
        .from("pdf_candidates")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .gte("created_at", monthStart)
        .lt("created_at", nextMonthStart);
      if (!countErr && count !== null) {
        processedPdfCount = count;
      }
    } catch (e) {
      logger.error("Erro ao buscar pdf_candidates em app-data:", e);
    }

    const { getPdfLimitFromPlan } = await import('@/lib/planos');
    const isAdmin = userRole === "superadmin" || userRole === "admin";
    const plan = empresaRes.data?.plano || null;
    const limit = getPdfLimitFromPlan(plan, (empresaRes.data || undefined) as any) ?? empresaRes.data?.limite_pdfs_mes ?? 10;
    const remaining = limit === null ? null : Math.max(0, limit - processedPdfCount);

    const quota = {
      isAdmin,
      used: processedPdfCount,
      limit,
      remaining: isAdmin ? null : remaining,
      plano: plan || (empresaRes.data?.plano ?? 'sem-plano'),
      mes: new Date().toISOString().slice(0, 7),
    };

    return NextResponse.json({
      empresa: empresaRes.data,
      jobs,
      candidates,
      quota,
      dashboardSummary,
      recentActivities,
      analytics: {
        scoreDistribution,
        usageItems,
        funnel: {
          analisados: totalCandidates,
          filtros: totalCandidates,
          scoreHigh: highScoreCandidates,
          shortlist: shortlistedCandidates,
          contatados: candidates.filter((candidate) => ["entrevista", "oferecido", "contratado"].includes(candidate.status)).length,
          contratados: candidates.filter((candidate) => candidate.status === "contratado").length,
        },
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
