import { handleApiError, fetchWithTimeout } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { createSupabaseAdminClient } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { getPlanAccessState } from "@/lib/planos";
import { checkRateLimit } from "@/lib/rate-limit";
import { callAI } from "@/lib/ai-client";
import { buildScoringPrompt } from "@/lib/scoring-prompt";

// IMPORTANT: Allow up to 5 minutes for PDF processing on Vercel (Pro plan)
export const maxDuration = 300;

function sanitizeText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .slice(0, 6000)
    .trim();
}

async function downloadAndParsePdf(
  storagePath: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
): Promise<string> {
  const start = Date.now();
  const { data, error } = await admin.storage
    .from("curriculos")
    .createSignedUrl(storagePath, 120);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL do PDF: ${error?.message}`);
  }

  const response = await fetchWithTimeout(data.signedUrl, {}, 30_000);
  if (!response.ok) {
    throw new Error(`Erro ao baixar PDF: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfParse = (await import("pdf-parse")).default;
  const pdfData = await pdfParse(buffer);
  const text = sanitizeText(pdfData.text);
  logger.info("downloadAndParsePdf completed", {
    storagePath,
    durationMs: Date.now() - start,
    length: text.length,
  });
  return text;
}

/**
 * Fallback inline processor — used only when BullMQ/Redis is unavailable.
 */
async function processCandidate(
  candidateId: string,
  storagePath: string | null | undefined,
  vagaId: string,
  batchId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
) {
  const procStart = Date.now();
  logger.info("processCandidate start", { candidateId, storagePath, vagaId, batchId });

  try {
    let effectiveStoragePath = storagePath;
    if (!effectiveStoragePath) {
      const { data: candidateData, error: candidateError } = await admin
        .from("pdf_candidates")
        .select("storage_path, file_url")
        .eq("id", candidateId)
        .single();

      if (candidateError) {
        throw new Error(`Falha ao carregar caminho do candidato: ${candidateError.message}`);
      }

      effectiveStoragePath = candidateData?.storage_path || candidateData?.file_url || null;
      if (effectiveStoragePath) {
        await admin.from("pdf_candidates").update({ storage_path: effectiveStoragePath }).eq("id", candidateId);
      }
    }

    if (!effectiveStoragePath) {
      throw new Error("Nenhum caminho de storage disponível para o candidato");
    }

    const cvText = await downloadAndParsePdf(effectiveStoragePath, admin);

    if (!cvText || cvText.length < 20) {
      logger.warn("[processCandidate] PDF text too short or empty", { candidateId, textLength: cvText?.length ?? 0 });
      await admin.from("pdf_candidates").update({ status: "erro", parsed_text: cvText || "" }).eq("id", candidateId);
      return { id: candidateId, status: "erro", file_url: effectiveStoragePath, error: "PDF vazio ou ilegível" };
    }

    const { data: criteriaData, error: critError } = await admin
      .from("criteria")
      .select("id,nome,peso,description,weight")
      .eq("vaga_id", vagaId);

    const formattedCriteria = (criteriaData || [])
      .map((c) => ({
        id: c.id,
        name: (c.nome || c.description || "").trim(),
        weight: c.peso ?? c.weight ?? 3,
      }))
      .filter((c) => c.name);

    let scoreFinal = 3.0;
    let candidatoNome = "Candidato sem nome";
    const extraFields: Record<string, unknown> = {};
    let criteriosForSave: { nome: string; nota: number; justificativa?: string }[] = [];

    // Build prompt based on whether criteria exist
    const hasCriteria = !critError && formattedCriteria.length > 0;
    const prompt = hasCriteria
      ? buildScoringPrompt(cvText, formattedCriteria)
      : `Analise o currículo abaixo e extraia as informações do candidato. Retorne SOMENTE JSON válido (sem markdown, sem texto extra).

CURRÍCULO:
${cvText.slice(0, 4000)}

Retorne EXATAMENTE este JSON (preencha com null se não encontrar):
{"nome":"nome completo","email":null,"telefone":null,"linkedin":null,"cidade":null,"cargo_atual":null,"empresa_atual":null,"pretensao_salarial":null,"disponibilidade":"A combinar","regime_preferido":null,"resumo":"resumo breve do perfil"}`;

    // Call AI with robust error handling
    let aiResult: Record<string, unknown> | null = null;
    try {
      const jsonString = await callAI(prompt);
      logger.info("[processCandidate] AI raw response", { candidateId, responseLength: jsonString.length, preview: jsonString.slice(0, 200) });
      
      // Clean and parse JSON
      let cleaned = jsonString.trim();
      // Remove markdown code blocks if present
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
      // Extract JSON object if wrapped in extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      
      aiResult = JSON.parse(cleaned);
    } catch (aiErr) {
      logger.error("[processCandidate] AI call/parse failed", {
        candidateId,
        error: aiErr instanceof Error ? aiErr.message : String(aiErr),
      });
      // Fallback: try to extract basic info from PDF text with regex
      aiResult = extractWithRegex(cvText);
    }

    // Process AI result with flexible type handling
    if (aiResult) {
      // Extract name (flexible: accept any string field)
      candidatoNome = String(aiResult.nome || aiResult.name || aiResult.nome_completo || "Candidato sem nome");
      
      // Extract score (flexible: accept string or number)
      if (hasCriteria) {
        const rawScore = aiResult.score_final ?? aiResult.score ?? aiResult.nota_final;
        if (rawScore !== null && rawScore !== undefined) {
          const parsed = Number(rawScore);
          if (!isNaN(parsed)) {
            scoreFinal = Math.max(1.0, Math.min(5.0, parsed));
          }
        }

        // Extract criteria scores
        const rawCriterios = aiResult.criterios || aiResult.criteria || [];
        if (Array.isArray(rawCriterios)) {
          criteriosForSave = rawCriterios
            .map((c: Record<string, unknown>) => ({
              nome: String(c.nome || c.name || c.criterio || ""),
              nota: Math.max(1.0, Math.min(5.0, Number(c.nota || c.score || c.note || 3))),
              justificativa: String(c.justificativa || c.justification || c.observacao || ""),
            }))
            .filter((c: { nome: string }) => c.nome);
        }
      }

      // Extract extra fields
      const fieldMap: [string, string][] = [
        ["email", "email_contato"],
        ["telefone", "telefone"],
        ["linkedin", "linkedin_url"],
        ["cidade", "cidade"],
        ["cargo_atual", "cargo_atual"],
        ["empresa_atual", "empresa_atual"],
        ["pretensao_salarial", "pretensao_salarial"],
        ["disponibilidade", "disponibilidade"],
        ["regime_preferido", "regime_preferido"],
        ["resumo", "resumo_ia"],
      ];
      for (const [srcKey, destKey] of fieldMap) {
        const val = aiResult[srcKey];
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          extraFields[destKey] = String(val);
        }
      }
    }

    // Save to database
    await admin
      .from("pdf_candidates")
      .update({
        parsed_text: cvText,
        score_final: scoreFinal,
        nome_candidato: candidatoNome,
        status: "concluido",
        ...extraFields,
      })
      .eq("id", candidateId);

    if (criteriosForSave.length > 0 && formattedCriteria.length > 0) {
      const evaluations = criteriosForSave
        .map((c) => {
          const dbCrit = formattedCriteria.find((d) => d.name === c.nome);
          return {
            candidate_id: candidateId,
            criteria_id: dbCrit?.id,
            nota: c.nota,
            justificativa: c.justificativa,
          };
        })
        .filter((e) => e.criteria_id);

      if (evaluations.length > 0) {
        await admin.from("candidate_evaluations").insert(evaluations);
      }
    }

    // Increment batch progress (ignore errors)
    try { await admin.rpc("incrementar_batch_processado", { p_candidate_id: candidateId }); } catch { /* ignore */ }

    // Increment company credits
    const { data: cand } = await admin
      .from("pdf_candidates")
      .select("empresa_id")
      .eq("id", candidateId)
      .single();
    if (cand?.empresa_id) {
      try { await admin.rpc("incrementar_creditos_pdf", { p_empresa_id: cand.empresa_id }); } catch { /* ignore */ }
    }

    logger.info("processCandidate completed", {
      candidateId,
      durationMs: Date.now() - procStart,
      scoreFinal,
      nome: candidatoNome,
      fieldsExtracted: Object.keys(extraFields).length,
    });
    return {
      id: candidateId,
      score_final: scoreFinal,
      nome_candidato: candidatoNome,
      file_url: effectiveStoragePath,
      status: "concluido",
      ...extraFields,
    };
  } catch (err) {
    console.error(`[upload-batch] Erro ao processar candidato ${candidateId}:`, err);
    try { await admin.from("pdf_candidates").update({ status: "erro" }).eq("id", candidateId); } catch { /* ignore */ }
    return { id: candidateId, status: "erro", file_url: storagePath };
  }
}

/**
 * Fallback extraction using regex when AI fails completely.
 */
function extractWithRegex(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Try to extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];
  
  // Try to extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/);
  if (phoneMatch) result.telefone = phoneMatch[0];
  
  // Try to extract LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) result.linkedin = `https://${linkedinMatch[0]}`;
  
  // Try to extract name (first line or "Nome:" pattern)
  const nomeMatch = text.match(/(?:nome|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
  if (nomeMatch) {
    result.nome = nomeMatch[1].trim();
  } else {
    // Use first capitalized words as name
    const firstLine = text.split("\n").find((l) => l.trim().length > 3 && l.trim().length < 80);
    if (firstLine) result.nome = firstLine.trim().slice(0, 60);
  }
  
  result.resumo = text.slice(0, 300).replace(/\n/g, " ").trim();
  result.disponibilidade = "A combinar";
  
  return result;
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario, error: usuarioError } = await admin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userId)
      .single();

    if (usuarioError || !usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada para este usuário" }, { status: 404 });
    }

    // Rate limit: 3 batch uploads per minute per company
    const rl = await checkRateLimit(`empresa:${usuario.empresa_id}:upload-batch`, 3, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error:
            "Limite de uploads excedido (máximo 3 lotes por minuto). Tente novamente mais tarde.",
        },
        { status: 429 }
      );
    }

    const { storagePaths, vaga_id } = (await req.json()) as {
      storagePaths?: string[];
      vaga_id?: string;
    };

    if (!storagePaths?.length) {
      return NextResponse.json({ error: "Lista de caminhos do storage invalida" }, { status: 400 });
    }

    if (!vaga_id) {
      return NextResponse.json({ error: "vaga_id obrigatorio" }, { status: 400 });
    }

    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .select("id, empresa_id")
      .eq("id", vaga_id)
      .single();

    if (vagaError || !vaga?.empresa_id) {
      return NextResponse.json({ error: "Vaga nao encontrada para este usuario" }, { status: 404 });
    }

    if (vaga.empresa_id !== usuario.empresa_id) {
      return NextResponse.json({ error: "Vaga não pertence à sua empresa." }, { status: 403 });
    }

    // ── Check quota ATOMICALLY via advisory lock (previne TOCTOU) ─────
    const { data: empresa } = await admin
      .from("empresas")
      .select("id,plano,limite_pdfs_mes,subscription_status")
      .eq("id", vaga.empresa_id)
      .single();

    const userRole = usuario?.role || null;
    const now = new Date();
    const { count } = await admin
      .from("pdf_candidates")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", vaga.empresa_id)
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
      .lt("created_at", new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
    const used = count ?? 0;
    const access = getPlanAccessState(empresa || undefined, used, userRole);
    const planLimit = access.pdfLimit;

    if (!access.canUploadPdf) {
      return NextResponse.json(
        {
          error: "Limite de uploads/processing de PDFs atingido",
          limit: planLimit,
          used,
          mes: now.toISOString().slice(0, 7),
          upgrade_message: access.isTrial
            ? "Seu trial inclui até 15 PDFs por mês. Faça upgrade para processar mais currículos."
            : "Você atingiu o limite de PDFs deste plano. Faça upgrade para processar mais.",
        },
        { status: 402 }
      );
    }

    // Usa RPC com advisory lock para reserva atômica (previne race condition)
    const effectiveLimit = planLimit ?? 9999;
    const { data: reserva, error: reservaError } = await admin.rpc("reservar_creditos_upload", {
      p_empresa_id: vaga.empresa_id,
      p_quantidade: storagePaths.length,
      p_limite: effectiveLimit,
    });

    if (reservaError) {
      // Fallback: se RPC não existe ainda, usa cálculo client-side
      logger.warn("[upload-batch] RPC reservar_creditos_upload indisponível, usando fallback", { error: reservaError.message });
    }

    const disponiveis = reserva?.disponiveis ?? (planLimit !== null ? Math.max(0, planLimit - used) : storagePaths.length);
    const arquivosPermitidos = storagePaths.slice(0, disponiveis);

    if (!arquivosPermitidos.length) {
      return NextResponse.json(
        {
          error: "Nenhum crédito disponível para processar PDFs.",
          limit: planLimit,
          used,
        },
        { status: 402 }
      );
    }

    // ── Create batch ─────────────────────────────────────────────────
    const batchId = crypto.randomUUID();
    const { error: batchError } = await admin.from("pdf_batches").insert({
      id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      total_files: arquivosPermitidos.length,
      processed_files: 0,
      status: "processing",
    });

    if (batchError) {
      return NextResponse.json({ error: "Falha na criacao do lote" }, { status: 500 });
    }

    // ── Create candidate records in PARALLEL ─────────────────────────
    const candidatesData = arquivosPermitidos.map((path) => ({
      id: crypto.randomUUID(),
      batch_id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      file_url: path,
      storage_path: path,
    }));

    const { error: candError } = await admin.from("pdf_candidates").insert(candidatesData);
    if (candError) {
      return NextResponse.json({ error: "Erro na insercao de dados" }, { status: 500 });
    }

    // ── Processamento: pequenos lotes são síncronos (confiável); grandes usam after() ──
    const shouldProcessInline = arquivosPermitidos.length <= 3;

    if (shouldProcessInline) {
      // Processa de forma síncrona e retorna os candidatos processados
      const processed: Record<string, unknown>[] = [];
      for (const cand of candidatesData) {
        const result = await processCandidate(cand.id, cand.file_url, vaga_id, batchId, admin);
        processed.push(result);
      }
      try {
        await admin.from("pdf_batches").update({ status: "completed" }).eq("id", batchId);
      } catch { /* ignore */ }

      return NextResponse.json({
        queued: candidatesData.length,
        batch_id: batchId,
        message: `${arquivosPermitidos.length} currículo(s) processado(s)`,
        candidates: processed,
      });
    }

    // Para lotes grandes, usa after() para resposta instantânea
    const candidatesToProcess = [...candidatesData];
    const vagaIdForBg = vaga_id;
    const batchIdForBg = batchId;

    after(async () => {
      const bgAdmin = createSupabaseAdminClient();
      const CONCURRENCY = 5;
      try {
        for (let i = 0; i < candidatesToProcess.length; i += CONCURRENCY) {
          const batch = candidatesToProcess.slice(i, i + CONCURRENCY);
          await Promise.all(
            batch.map((cand) =>
              processCandidate(cand.id, cand.file_url, vagaIdForBg, batchIdForBg, bgAdmin)
            )
          );
        }
      } catch (bgErr) {
        logger.error("[upload-batch] Background processing failed", {
          batchId: batchIdForBg,
          error: bgErr instanceof Error ? bgErr.message : String(bgErr),
        });
      }
      // Mark batch as completed (or failed)
      try {
        await bgAdmin.from("pdf_batches").update({ status: "completed" }).eq("id", batchIdForBg);
      } catch { /* ignore */ }
    });

    // ── Return IMMEDIATELY — user sees instant response ──────────────
    return NextResponse.json({
      queued: candidatesData.length,
      batch_id: batchId,
      message: `${arquivosPermitidos.length} currículos enviados para processamento`,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
