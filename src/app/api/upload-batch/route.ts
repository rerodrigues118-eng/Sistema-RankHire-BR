import { handleApiError, fetchWithTimeout } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { getPdfLimitFromPlan } from '@/lib/planos';
import { callAI } from "@/lib/ai-client";
import { buildScoringPrompt } from "@/lib/scoring-prompt";
import { getPdfQueue, getRedisConnection } from '@/lib/queue';

// IMPORTANT: Allow up to 60s for PDF processing on Vercel
export const maxDuration = 60;

function sanitizeText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .slice(0, 6000)
    .trim();
}

async function downloadAndParsePdf(storagePath: string, admin: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
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

  // Use dynamic import to avoid issues with pdf-parse in edge runtime
  const pdfParse = (await import('pdf-parse')).default;
  const pdfData = await pdfParse(buffer);
  const text = sanitizeText(pdfData.text);
  logger.info('downloadAndParsePdf completed', { storagePath, durationMs: Date.now() - start, length: text.length });
  return text;
}

async function processCandidate(
  candidateId: string,
  storagePath: string,
  vagaId: string,
  batchId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
) {
  const procStart = Date.now();
  logger.info('processCandidate start', { candidateId, storagePath, vagaId, batchId });
  try {
    const cvText = await downloadAndParsePdf(storagePath, admin);

    const { data: criteriaData, error: critError } = await admin
      .from("criteria")
      .select("id,nome,peso,description,weight")
      .eq("vaga_id", vagaId);

    // If no criteria, still save the CV text with a neutral score
    const formattedCriteria = (criteriaData || [])
      .map((c) => ({
        id: c.id,
        name: (c.nome || c.description || "").trim(),
        weight: c.peso ?? c.weight ?? 3,
      }))
      .filter((c) => c.name);

    let scoreFinal = 3.0;
    let candidatoNome = "Candidato sem nome";
    let extraFields: Record<string, unknown> = {};
    let criteriosForSave: { nome: string; nota: number; justificativa?: string }[] = [];

    if (!critError && formattedCriteria.length > 0) {
      const prompt = buildScoringPrompt(cvText, formattedCriteria);
      const jsonString = await callAI(prompt);
      const cleanJson = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(cleanJson);

      if (typeof result.score_final === "number" && Array.isArray(result.criterios)) {
        scoreFinal = Math.max(1.0, Math.min(5.0, Number(result.score_final)));
        criteriosForSave = result.criterios.map((c: { nome: string; nota: number; justificativa?: string }) => ({
          ...c,
          nota: Math.max(1.0, Math.min(5.0, Number(c.nota))),
        }));
        candidatoNome = result.nome || "Candidato sem nome";
        if (result.email) extraFields.email_contato = result.email;
        if (result.telefone) extraFields.telefone = result.telefone;
        if (result.linkedin) extraFields.linkedin_url = result.linkedin;
        if (result.cidade) extraFields.cidade = result.cidade;
        if (result.cargo_atual) extraFields.cargo_atual = result.cargo_atual;
        if (result.empresa_atual) extraFields.empresa_atual = result.empresa_atual;
        if (result.pretensao_salarial) extraFields.pretensao_salarial = result.pretensao_salarial;
        if (result.disponibilidade) extraFields.disponibilidade = result.disponibilidade;
        if (result.regime_preferido) extraFields.regime_preferido = result.regime_preferido;
        if (result.resumo) extraFields.resumo_ia = result.resumo;
      }
    }

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

    // Save per-criteria evaluations
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

    // Update batch progress
    const { data: batch } = await admin
      .from("pdf_batches")
      .select("processed_files,total_files")
      .eq("id", batchId)
      .single();

    if (batch) {
      const newProcessed = (batch.processed_files || 0) + 1;
      await admin
        .from("pdf_batches")
        .update({
          processed_files: newProcessed,
          status: newProcessed >= batch.total_files ? "completed" : "processing",
        })
        .eq("id", batchId);
    }

    logger.info('processCandidate completed', { candidateId, durationMs: Date.now() - procStart, scoreFinal });
    return { id: candidateId, score_final: scoreFinal, nome_candidato: candidatoNome, file_url: storagePath, status: "concluido", ...extraFields };
  } catch (err) {
    console.error(`[upload-batch] Erro ao processar candidato ${candidateId}:`, err);
    await admin.from("pdf_candidates").update({ status: "erro" }).eq("id", candidateId);
    return { id: candidateId, status: "erro", file_url: storagePath };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
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

    // admin-client: justificado — upload em lote e parsing usam privilégios administrativos
    const admin = createSupabaseAdminClient();
    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .select("id, empresa_id")
      .eq("id", vaga_id)
      .single();

    if (vagaError || !vaga?.empresa_id) {
      return NextResponse.json({ error: "Vaga nao encontrada para este usuario" }, { status: 404 });
    }

    // Check quota before creating batch
    const { data: empresa } = await admin.from('empresas').select('id,plano,limite_pdfs_mes').eq('id', vaga.empresa_id).single();
    const planLimit = getPdfLimitFromPlan(empresa?.plano, empresa || undefined) ?? empresa?.limite_pdfs_mes ?? 10;

    if (planLimit !== null) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { count } = await admin
        .from('pdf_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', vaga.empresa_id)
        .gte('created_at', monthStart)
        .lt('created_at', nextMonthStart);
      const used = count ?? 0;
      if (used >= planLimit) {
        return NextResponse.json({
          error: 'Limite de uploads/processing de PDFs atingido',
          limit: planLimit,
          used,
          mes: now.toISOString().slice(0, 7),
          upgrade_message: `Você atingiu o limite de ${planLimit} PDFs neste mês. Faça upgrade para processar mais.`
        }, { status: 403 });
      }
    }

    const batchId = crypto.randomUUID();
    const { error: batchError } = await admin.from("pdf_batches").insert({
      id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      total_files: storagePaths.length,
      status: "processing",
    });

    if (batchError) {
      return NextResponse.json({ error: "Falha na criacao do lote" }, { status: 500 });
    }

    const candidatesData = storagePaths.map((path) => ({
      id: crypto.randomUUID(),
      batch_id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      file_url: path,
    }));

    const { error: candError } = await admin.from("pdf_candidates").insert(candidatesData);
    if (candError) {
      return NextResponse.json({ error: "Erro na insercao de dados" }, { status: 500 });
    }

    const redisConn = getRedisConnection();
    if (redisConn) {
      try {
        const pdfQueue = await getPdfQueue();
        await Promise.all(
          candidatesData.map((cand) =>
            pdfQueue.add("pdf-process", {
              candidateId: cand.id,
              storagePath: cand.file_url,
              vaga_id,
              batchId,
            })
          )
        );
      } catch (queueError) {
        console.error("[upload-batch] Falha ao enfileirar jobs de PDF:", queueError);
      }

      return NextResponse.json({
        queued: candidatesData.length,
        batch_id: batchId,
        message: "Processamento iniciado em segundo plano.",
      });
    }

    // Process all PDFs inline (fallback when background queue is unavailable)
    const processedCandidates = await Promise.all(
      candidatesData.map((cand) =>
        processCandidate(cand.id, cand.file_url, vaga_id, batchId, admin)
      )
    );

    return NextResponse.json({
      queued: candidatesData.length,
      batch_id: batchId,
      candidates: processedCandidates,
      message: "Processamento concluido com sucesso",
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
