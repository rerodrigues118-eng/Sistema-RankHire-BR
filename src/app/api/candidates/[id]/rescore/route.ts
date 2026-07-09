import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { callAI } from "@/lib/ai-client";
import { buildScoringPrompt } from "@/lib/scoring-prompt";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import Redis from "ioredis";

// Reuse Redis client instance to avoid connection leaks
let redisClient: Redis | null = null;
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!);
  }
  return redisClient;
}

type ScoringResult = {
  score_final: number;
  nome?: string;
  criterios: {
    nome: string;
    nota: number;
    justificativa?: string;
  }[];
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const { id } = await params;
    const admin = createSupabaseAdminClient();

    // 1. Fetch user's company ID
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const empresaId = usuario.empresa_id;

    // 2. Fetch candidate and ensure company isolation (security constraint 1)
    const { data: candidate } = await admin
      .from("pdf_candidates")
      .select("id, empresa_id, parsed_text, vaga_id")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
    }

    // 3. Apply rate limit (security constraint 2: 5 rescores per minute per company)
    const redis = getRedisClient();
    const rateLimitKey = `rate:rescore:${empresaId}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 60);
    }
    if (currentCount > 5) {
      return NextResponse.json(
        { error: "Limite de 5 recálculos por minuto excedido para esta empresa. Tente novamente em breve." },
        { status: 429 }
      );
    }

    // 4. Validate parsed_text is not empty (edge case 6)
    if (!candidate.parsed_text?.trim()) {
      return NextResponse.json(
        { error: "Texto do currículo não disponível. Faça upload novamente." },
        { status: 422 }
      );
    }

    // 5. Clean and truncate candidate text (edge case 7)
    const textoSeguro = candidate.parsed_text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
      .slice(0, 12000)
      .trim();

    // 6. Fetch vacancy criteria
    const { data: criteria } = await admin
      .from("criteria")
      .select("id, nome, peso")
      .eq("vaga_id", candidate.vaga_id)
      .order("created_at", { ascending: true });

    if (!criteria || criteria.length === 0) {
      return NextResponse.json(
        { error: "Nenhum critério cadastrado para esta vaga. Configure os critérios na aba Funil antes de recalcular." },
        { status: 400 }
      );
    }

    const formattedCriteria = criteria.map((c) => ({
      id: c.id,
      name: c.nome,
      weight: c.peso,
    }));

    // 7. Call Groq API via callAI
    const prompt = buildScoringPrompt(textoSeguro, formattedCriteria);
    const jsonString = await callAI(prompt);
    
    // Clean potential markdown blocks from response
    const cleanJsonString = jsonString
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result: ScoringResult;
    try {
      result = JSON.parse(cleanJsonString) as ScoringResult;
    } catch {
      return NextResponse.json(
        { error: "O analisador de IA retornou uma resposta em formato inválido." },
        { status: 500 }
      );
    }

    if (!Array.isArray(result.criterios)) {
      return NextResponse.json(
        { error: "A resposta da IA está com a lista de critérios ausente ou corrompida." },
        { status: 500 }
      );
    }

    // 8. Clamp & validate scores to [1.0, 5.0] (score logic 5)
    const sanitizedCriteria = result.criterios.map((c) => ({
      ...c,
      nota: Math.max(1.0, Math.min(5.0, Number(c.nota || 1.0))),
    }));

    // 9. Synchronize candidate evaluations in DB
    // First, clear old ones
    await admin
      .from("candidate_evaluations")
      .delete()
      .eq("candidate_id", candidate.id);

    // Insert new ones
    const evaluationsToInsert = sanitizedCriteria
      .map((c) => {
        const dbCrit = criteria.find((x) => x.nome === c.nome);
        return {
          candidate_id: candidate.id,
          criteria_id: dbCrit?.id,
          nota: c.nota,
          justificativa: c.justificativa || "",
        };
      })
      .filter((ev) => ev.criteria_id);

    if (evaluationsToInsert.length > 0) {
      const { error: insertError } = await admin
        .from("candidate_evaluations")
        .insert(evaluationsToInsert);
      
      if (insertError) {
        return NextResponse.json({ error: "Falha ao gravar avaliações: " + insertError.message }, { status: 500 });
      }
    }

    // 10. Recalculate Final Score using Weighted Average (score logic 3)
    let sumWeightedScores = 0;
    let sumWeights = 0;

    for (const c of criteria) {
      const evaluation = evaluationsToInsert.find((ev) => ev.criteria_id === c.id);
      const notaIa = evaluation ? evaluation.nota : 1.0;
      // As it's a fresh rescore, there is no manual score initially.
      const notaEfetiva = notaIa;

      sumWeightedScores += (notaEfetiva * c.peso);
      sumWeights += c.peso;
    }

    const calculatedScoreFinal = sumWeights > 0 ? (sumWeightedScores / sumWeights) : 1.0;
    const finalScore = Math.max(1.0, Math.min(5.0, calculatedScoreFinal));

    // Update candidate final score and name in pdf_candidates
    const candidatoNome = result.nome || "Candidato sem nome";
    const { error: updateError } = await admin
      .from("pdf_candidates")
      .update({
        score_final: finalScore,
        nome_candidato: candidatoNome,
      })
      .eq("id", candidate.id);

    if (updateError) {
      return NextResponse.json({ error: "Falha ao atualizar o score do candidato: " + updateError.message }, { status: 500 });
    }

    // 11. Fetch final evaluations to return structured
    const evaluationsForResponse = criteria.map((c) => {
      const ev = evaluationsToInsert.find((x) => x.criteria_id === c.id);
      return {
        name: c.nome,
        score: ev ? ev.nota : 1.0,
        justification: ev ? ev.justificativa : "Não mencionado no currículo",
        weight: c.peso,
      };
    });

    return NextResponse.json({
      success: true,
      name: candidatoNome,
      score: finalScore,
      evaluations: evaluationsForResponse,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
