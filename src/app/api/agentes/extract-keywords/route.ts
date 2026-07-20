import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { callAI } from "@/lib/ai-client";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/agentes/extract-keywords
 * Extrai palavras-chave de um briefing para busca otimizada no LinkedIn.
 * Usado pelo Agente IA e pela Busca Inteligente.
 *
 * Body: { briefing: string, vaga_id?: string }
 * Returns: { keywords_principais, keywords_secundarias, cargos_similares, boolean_expression }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // ── Rate limit: 10 extrações por empresa por minuto ─────────────
    const rl = await checkRateLimit(`extract-kw:${usuario.empresa_id}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Limite de extrações excedido (máximo 10/min). Aguarde." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { briefing?: string; vaga_id?: string };

    if (!body.briefing?.trim()) {
      return NextResponse.json({ error: "Briefing é obrigatório" }, { status: 400 });
    }

    if (body.briefing.length > 5000) {
      return NextResponse.json({ error: "Briefing muito longo (máximo 5000 caracteres)" }, { status: 400 });
    }

    // Busca título da vaga se vaga_id fornecido — valida ownership
    let vagaTitulo = "";
    if (body.vaga_id) {
      const { data: vaga } = await admin
        .from("vagas")
        .select("title, empresa_id")
        .eq("id", body.vaga_id)
        .single();
      if (!vaga || vaga.empresa_id !== usuario.empresa_id) {
        return NextResponse.json({ error: "Vaga não encontrada ou não pertence à sua empresa" }, { status: 404 });
      }
      vagaTitulo = vaga.title || "";
    }

    // ── Extrai keywords via IA ──────────────────────────────────────
    const systemPrompt =
      "Você é um especialista em recrutamento e busca de talentos no LinkedIn. Retorne APENAS JSON válido, sem markdown.";

    const userPrompt = `Dado este briefing de vaga, extraia as palavras-chave mais relevantes para busca de candidatos no LinkedIn.

${vagaTitulo ? `Título da vaga: ${vagaTitulo}` : ""}
Briefing: ${body.briefing}

Retorne EXATAMENTE este JSON (sem markdown, sem explicação):
{
  "keywords_principais": ["python", "react", "typescript"],
  "keywords_secundarias": ["aws", "docker", "ci/cd"],
  "cargos_similares": ["desenvolvedor fullstack", "engenheiro de software", "dev senior"],
  "boolean_expression": "python AND (react OR nextjs) AND typescript",
  "sugestao_filtros": {
    "experiencia_minima": 3,
    "experiencia_maxima": 10,
    "localizacao": "Brasil",
    "idiomas": ["português", "inglês"]
  }
}`;

    try {
      const raw = await callAI(
        userPrompt,
        systemPrompt,
        process.env.GROQ_MODEL_CRITERIA || "llama-3.3-70b-versatile"
      );

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON não encontrado na resposta da IA");
      }

      const resultado = JSON.parse(jsonMatch[0]) as {
        keywords_principais?: string[];
        keywords_secundarias?: string[];
        cargos_similares?: string[];
        boolean_expression?: string;
        sugestao_filtros?: {
          experiencia_minima?: number;
          experiencia_maxima?: number;
          localizacao?: string;
          idiomas?: string[];
        };
      };

      // ── Salva critérios no agente se vaga_id fornecido ──────────
      if (body.vaga_id) {
        const criteriosIa = [
          ...(resultado.keywords_principais || []).map((kw) => ({
            nome: kw,
            peso: 5,
            descricao: "Palavra-chave principal",
          })),
          ...(resultado.keywords_secundarias || []).map((kw) => ({
            nome: kw,
            peso: 3,
            descricao: "Palavra-chave secundária",
          })),
        ].slice(0, 8);

        await admin
          .from("agentes_ia")
          .update({ criterios_ia: criteriosIa })
          .eq("vaga_id", body.vaga_id)
          .eq("empresa_id", usuario.empresa_id);
      }

      return NextResponse.json({
        keywords_principais: resultado.keywords_principais || [],
        keywords_secundarias: resultado.keywords_secundarias || [],
        cargos_similares: resultado.cargos_similares || [],
        boolean_expression: resultado.boolean_expression || "",
        sugestao_filtros: resultado.sugestao_filtros || {},
      });
    } catch (aiError) {
      logger.warn("[extract-keywords] Falha na IA, usando fallback heurístico", {
        error: aiError instanceof Error ? aiError.message : "unknown",
      });

      // ── Fallback heurístico ───────────────────────────────────────
      const text = body.briefing.toLowerCase();
      const words = text.split(/[,.;\n\s]+/).filter((w) => w.length > 3);
      const uniqueWords = [...new Set(words)].slice(0, 10);

      return NextResponse.json({
        keywords_principais: uniqueWords.slice(0, 5),
        keywords_secundarias: uniqueWords.slice(5, 10),
        cargos_similares: vagaTitulo ? [vagaTitulo] : [],
        boolean_expression: uniqueWords.slice(0, 3).join(" AND "),
        sugestao_filtros: {
          experiencia_minima: text.includes("senior") ? 5 : text.includes("pleno") ? 3 : 2,
          experiencia_maxima: text.includes("senior") ? 15 : 10,
          localizacao: text.includes("remoto") ? "Remoto" : "Brasil",
          idiomas: ["português"],
        },
      });
    }
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
