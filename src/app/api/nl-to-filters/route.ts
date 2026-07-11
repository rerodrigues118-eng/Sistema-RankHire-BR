import { handleApiError } from "@/lib/api";
import { callAI } from "@/lib/ai-client";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type ParsedFilters = {
  criterios?: unknown[];
  filtros_sugeridos?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    await requireAuth();
    const { text } = (await req.json()) as { text?: string; mode?: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Texto vazio" }, { status: 400 });
    }

    const systemPrompt =
      "Voce e um assistente especialista em recrutamento brasileiro. Analise a descricao de vaga fornecida e retorne APENAS um JSON valido, sem texto adicional, sem markdown, sem explicacoes.";

    const userPrompt = `Analise esta descricao e extraia:
1. Ate 5 criterios de selecao com peso 1-5
2. Filtros de busca sugeridos

Descricao: ${text}

Retorne EXATAMENTE neste formato JSON:
{
  "criterios": [
    {
      "nome": "Nome do criterio",
      "descricao": "O que sera avaliado neste criterio",
      "peso": 5
    }
  ],
  "filtros_sugeridos": {
    "job_titles": ["cargo1", "cargo2"],
    "localizacao": "cidade ou estado",
    "experiencia_minima": 3,
    "experiencia_maxima": 8,
    "idiomas": [{"idioma": "Ingles", "nivel": "fluente"}],
    "keywords": ["palavra1", "palavra2"],
    "boolean_expression": "keyword1 AND (\\"keyword2\\" OR keyword3)"
  }
}`;

    const model = process.env.GROQ_MODEL_CRITERIA || "llama-3.3-70b-versatile";
    try {
      const rawContent = await callAI(userPrompt, systemPrompt, model);

      let jsonStr = rawContent.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      let parsed: ParsedFilters;
      try {
        parsed = JSON.parse(jsonStr) as ParsedFilters;
      } catch {
        return NextResponse.json({ error: "IA retornou formato invalido" }, { status: 500 });
      }

      return NextResponse.json({
        criterios: parsed.criterios || [],
        filtros_sugeridos: parsed.filtros_sugeridos || {},
      });
    } catch {
      const fallbackCriterios = [
        { nome: "Experiência relevante", descricao: "Avalie se o candidato possui experiência compatível com a vaga", peso: 4 },
        { nome: "Domínio técnico", descricao: "Avalie o nível técnico e as competências principais", peso: 4 },
      ];
      const fallbackFiltros = {
        job_titles: text.split(/,| e | ou /).map((item) => item.trim()).filter(Boolean).slice(0, 3),
        localizacao: "Brasil",
        experiencia_minima: 2,
        experiencia_maxima: 8,
        idiomas: [],
        keywords: text.split(/\s+/).filter(Boolean).slice(0, 5),
        boolean_expression: "",
      };

      return NextResponse.json({
        criterios: fallbackCriterios,
        filtros_sugeridos: fallbackFiltros,
      });
    }
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
