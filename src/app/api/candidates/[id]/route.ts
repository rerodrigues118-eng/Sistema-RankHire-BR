import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type CandidatePatchBody = {
  shortlist?: boolean;
  status?: string;
  name?: string;
  role?: string;
  company?: string;
  city?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  observacoes?: string;
  pretensaoSalarial?: string;
  disponibilidade?: string;
  regime?: string;
  evaluations?: { name: string; manualScore?: number | null }[];
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();
    // admin-client: justified — candidate updates and evaluation writes require admin privileges server-side
    const { id } = await params;
    const body = (await req.json()) as CandidatePatchBody;

    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    // Ensure candidate belongs to this company (security constraint 1)
    const { data: candidate } = await admin
      .from("pdf_candidates")
      .select("id, vaga_id")
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: "Candidato nao encontrado" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.shortlist === "boolean") update.shortlist = body.shortlist;
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.name === "string") update.nome_candidato = body.name;
    if (typeof body.role === "string") update.cargo_atual = body.role;
    if (typeof body.company === "string") update.empresa_atual = body.company;
    if (typeof body.city === "string") update.cidade = body.city;
    if (typeof body.email === "string") update.email_contato = body.email;
    if (typeof body.phone === "string") update.telefone = body.phone;
    if (typeof body.linkedinUrl === "string") update.linkedin_url = body.linkedinUrl;
    if (typeof body.observacoes === "string") update.observacoes = body.observacoes;
    if (typeof body.pretensaoSalarial === "string") update.pretensao_salarial = body.pretensaoSalarial;
    if (typeof body.disponibilidade === "string") update.disponibilidade = body.disponibilidade;
    if (typeof body.regime === "string") update.regime_preferido = body.regime;

    // Handle manual score updates if provided (score logic 4)
    if (Array.isArray(body.evaluations)) {
      // Load vacancy criteria
      const { data: criteria } = await admin
        .from("criteria")
        .select("id, nome, peso")
        .eq("vaga_id", candidate.vaga_id);

      if (criteria && criteria.length > 0) {
        // Load existing evaluations
        const { data: existingEvals } = await admin
          .from("candidate_evaluations")
          .select("id, criteria_id")
          .eq("candidate_id", id);

        for (const ev of body.evaluations) {
          const dbCrit = criteria.find((c) => c.nome === ev.name);
          if (!dbCrit) continue;

          const existing = existingEvals?.find((x) => x.criteria_id === dbCrit.id);
          const manualScore = typeof ev.manualScore === "number" 
            ? Math.max(1.0, Math.min(5.0, ev.manualScore)) 
            : null;

          if (existing) {
            await admin
              .from("candidate_evaluations")
              .update({ nota_manual: manualScore })
              .eq("id", existing.id);
          } else {
            await admin
              .from("candidate_evaluations")
              .insert({
                candidate_id: id,
                criteria_id: dbCrit.id,
                nota: 1.0, // Default AI score fallback
                nota_manual: manualScore,
              });
          }
        }

        // Recalculate Final Score using Weighted Average (score logic 3)
        const { data: updatedEvals } = await admin
          .from("candidate_evaluations")
          .select("criteria_id, nota, nota_manual")
          .eq("candidate_id", id);

        let sumWeightedScores = 0;
        let sumWeights = 0;

        for (const c of criteria) {
          const ev = updatedEvals?.find((x) => x.criteria_id === c.id);
          const notaIa = ev ? ev.nota : 1.0;
          const notaManual = ev ? ev.nota_manual : null;
          const notaEfetiva = notaManual !== null && notaManual !== undefined ? notaManual : notaIa;

          sumWeightedScores += (notaEfetiva * c.peso);
          sumWeights += c.peso;
        }

        const calculatedScoreFinal = sumWeights > 0 ? (sumWeightedScores / sumWeights) : 1.0;
        update.score_final = Math.max(1.0, Math.min(5.0, calculatedScoreFinal));
      }
    }

    const { data: updatedCandidate, error } = await admin
      .from("pdf_candidates")
      .update(update)
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id)
      .select("id,nome_candidato,cargo_atual,empresa_atual,cidade,email_contato,telefone,score_final,linkedin_url,status,observacoes,pretensao_salarial,disponibilidade,regime_preferido,resumo_ia")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Load final evaluations to return to client
    const { data: finalEvals } = await admin
      .from("candidate_evaluations")
      .select("nota, nota_manual, justificativa, criteria(nome, peso)")
      .eq("candidate_id", id);

    const formattedEvals = ((finalEvals || []) as Array<Record<string, unknown>>).map((e: Record<string, unknown>) => {
      const criteria = e.criteria as Record<string, unknown> | undefined;
      return {
        name: (criteria?.nome as string | undefined) || "Critério",
        score: e.nota,
        manualScore: e.nota_manual,
        justification: (e.justificativa as string | undefined) || "",
        weight: (criteria?.peso as number | undefined) || 1,
      };
    });

    return NextResponse.json({
      candidate: {
        id: updatedCandidate.id,
        name: updatedCandidate.nome_candidato || "",
        role: updatedCandidate.cargo_atual || "",
        company: updatedCandidate.empresa_atual || "",
        city: updatedCandidate.cidade || "",
        email: updatedCandidate.email_contato || "",
        phone: updatedCandidate.telefone || "",
        score: Number(updatedCandidate.score_final || 0),
        linkedinUrl: updatedCandidate.linkedin_url || "#",
        status: updatedCandidate.status,
        observacoes: updatedCandidate.observacoes || "",
        evaluations: formattedEvals,
        pretensaoSalarial: updatedCandidate.pretensao_salarial || "",
        disponibilidade: updatedCandidate.disponibilidade || "",
        regime: updatedCandidate.regime_preferido || "",
        aiSummary: updatedCandidate.resumo_ia || "",
      }
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

