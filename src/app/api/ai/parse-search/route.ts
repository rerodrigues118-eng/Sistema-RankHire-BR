import { handleApiError } from "@/lib/api";
import { callAI } from "@/lib/ai-client";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

/**
 * POST /api/ai/parse-search
 * Takes a natural-language query and returns structured search filters + criteria.
 * Used as Step 1 of the 3-step NLP search flow in Busca Inteligente.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = (await req.json()) as { query?: string; vagaContext?: string };

    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Query vazia" }, { status: 400 });
    }

    const systemPrompt =
      "Voce e um especialista em recrutamento brasileiro. Analise a descricao e retorne APENAS um JSON valido, sem texto extra, sem markdown.";

    const userPrompt = `Analise esta busca de candidato e extraia criterios e filtros:

Query: ${body.query}
${body.vagaContext ? `Contexto da vaga: ${body.vagaContext}` : ""}

Retorne EXATAMENTE neste JSON:
{
  "criterios": [
    { "nome": "string", "descricao": "string", "peso": 5 }
  ],
  "filtros": {
    "job_titles": ["cargo1"],
    "location": "cidade ou pais",
    "keywords": ["skill1", "skill2"],
    "experiencia_minima": 2,
    "experiencia_maxima": 8,
    "idiomas": ["Portugues"],
    "boolean_expression": "keyword1 AND keyword2"
  },
  "resumo": "Frase curta descrevendo o candidato ideal"
}`;

    const model = process.env.GROQ_MODEL_CRITERIA || "llama-3.3-70b-versatile";
    const raw = await callAI(userPrompt, systemPrompt, model);

    const match = raw.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : raw;

    let parsed: { criterios?: unknown[]; filtros?: Record<string, unknown>; resumo?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback if AI returns invalid JSON
      parsed = {
        criterios: [
          { nome: "Experiência relevante", descricao: body.query, peso: 5 },
        ],
        filtros: {
          job_titles: [],
          location: "Brasil",
          keywords: body.query.split(" ").filter(w => w.length > 3).slice(0, 5),
        },
        resumo: body.query,
      };
    }

    return NextResponse.json({
      criterios: parsed.criterios || [],
      filtros: parsed.filtros || {},
      resumo: parsed.resumo || body.query,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
