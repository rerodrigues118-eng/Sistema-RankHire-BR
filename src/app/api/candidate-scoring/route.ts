import { handleApiError } from "@/lib/api";
import { callAI } from "@/lib/ai-client";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type CriterioInput = {
  nome: string;
  peso: number;
  descricao?: string;
};

type ExperienciaInput = {
  cargo?: string;
  empresa?: string;
};

type PerfilInput = {
  nome?: string;
  cargo?: string;
  empresa?: string;
  experiencia_anos?: number;
  skills?: string[];
  experiencias?: ExperienciaInput[];
  idiomas?: string[];
  formacao?: string;
  sobre?: string;
};

export async function POST(req: Request) {
  try {
    await requireAuth();
    const { criterios, perfil } = (await req.json()) as {
      criterios?: CriterioInput[];
      perfil?: PerfilInput;
    };

    if (!criterios?.length || !perfil) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const systemPrompt =
      "Voce e um avaliador de candidatos para recrutamento. Analise o perfil e retorne APENAS JSON valido, sem markdown, sem texto adicional.";

    const criteriosText = criterios
      .map((c) => `- ${c.nome} (peso ${c.peso}): ${c.descricao ?? ""}`)
      .join("\n");

    const historico =
      perfil.experiencias?.map((e) => `${e.cargo ?? ""} em ${e.empresa ?? ""}`).join(", ") || "N/A";

    const userPrompt = `Criterios de avaliacao:
${criteriosText}

Perfil do candidato:
Nome: ${perfil.nome || "N/A"}
Cargo atual: ${perfil.cargo || "N/A"}
Empresa: ${perfil.empresa || "N/A"}
Experiencia: ${perfil.experiencia_anos || 0} anos
Habilidades: ${perfil.skills?.join(", ") || "N/A"}
Historico: ${historico}
Idiomas: ${perfil.idiomas?.join(", ") || "N/A"}
Formacao: ${perfil.formacao || "N/A"}
Sobre: ${perfil.sobre ? perfil.sobre.substring(0, 400) : "N/A"}

Retorne EXATAMENTE este JSON (sem markdown):
{
  "score_final": 4.2,
  "criterios": [
    {
      "nome": "Nome do criterio",
      "peso": 5,
      "nota": 4.5,
      "justificativa": "Uma linha explicando a nota"
    }
  ],
  "resumo": "Resumo em 1-2 linhas sobre o candidato"
}

Regras:
- Notas sempre entre 1.0 e 5.0
- score_final = media ponderada pelos pesos
- Justificativas em portugues, maximo 1 linha
- Se criterio nao mencionado no perfil: nota 1.0`;

    const model = process.env.GROQ_MODEL_SCORING || "llama-3.1-8b-instant";
    const rawContent = await callAI(userPrompt, systemPrompt, model);

    let jsonStr = rawContent.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      return NextResponse.json({ error: "IA retornou formato invalido" }, { status: 500 });
    }
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
