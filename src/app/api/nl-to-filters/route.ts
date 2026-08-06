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
      const fallback = parseTextToFallbackFilters(text);
      return NextResponse.json(fallback);
    }
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

function parseTextToFallbackFilters(text: string) {
  const clean = text.replace(/["'\\]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  
  const yearsMatch = clean.match(/(\d+)\s*(?:anos?|yrs?|anos?\s+de\s+experi[êe]ncia)/i);
  const minYears = yearsMatch ? parseInt(yearsMatch[1]) : null;

  const knownTitles = ["desenvolvedor", "developer", "engineer", "designer", "gerente", "analista", "coordenador", "diretor", "consultor", "especialista", "lead"];
  const foundTitles = words.filter(w => knownTitles.some(kt => w.toLowerCase().includes(kt)));
  const jobTitles = foundTitles.length > 0 ? foundTitles : [words.slice(0, 2).join(" ")];

  const commonTech = ["github", "git", "react", "node", "python", "java", "figma", "photoshop", "aws", "docker", "sql", "javascript", "typescript"];
  const keywords = words.filter(w => commonTech.includes(w.toLowerCase()));

  const criterios = [];
  if (minYears) {
    criterios.push({
      nome: `Possui ${minYears}+ anos de experiência comprovada`,
      descricao: `Avalie se o candidato acumula ao menos ${minYears} anos na função.`,
      peso: 5,
    });
  }
  if (keywords.length > 0) {
    criterios.push({
      nome: `Domínio prático de ${keywords.join(" e ").toUpperCase()}`,
      descricao: `Experiência demonstrável utilizando ${keywords.join(", ")}.`,
      peso: 5,
    });
  }
  criterios.push({
    nome: `Adequação técnica ao perfil de ${jobTitles.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" / ")}`,
    descricao: `Vivência profissional e entregas alinhadas ao escopo da vaga.`,
    peso: 4,
  });

  return {
    criterios: criterios.slice(0, 4),
    filtros_sugeridos: {
      job_titles: jobTitles.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
      localizacao: "Brasil",
      experiencia_minima: minYears || 2,
      experiencia_maxima: minYears ? minYears + 5 : 8,
      idiomas: [],
      keywords: keywords.length > 0 ? keywords : words.slice(0, 4),
      boolean_expression: "",
    },
  };
}
