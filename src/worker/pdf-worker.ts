import 'dotenv/config';

import { fetchWithTimeout } from "../lib/api";
import { callAI } from "../lib/ai-client";
import { getRedisConnection } from "../lib/queue";
import { buildScoringPrompt } from "../lib/scoring-prompt";
import { createClient } from "@supabase/supabase-js";
import { Job, Worker } from "bullmq";

import pdfParse from 'pdf-parse';

// Early-exit guards for missing environment variables
if (!process.env.REDIS_URL) {
  process.exit(0);
}

if (!process.env.GROQ_API_KEY) {
  // IA scoring disabled
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type ScoringResult = {
  score_final: number;
  nome?: string;
  email?: string | null;
  telefone?: string | null;
  linkedin?: string | null;
  cidade?: string | null;
  cargo_atual?: string | null;
  empresa_atual?: string | null;
  pretensao_salarial?: string | null;
  disponibilidade?: string | null;
  regime_preferido?: string | null;
  resumo?: string | null;
  criterios: {
    nome: string;
    nota: number;
    justificativa?: string;
  }[];
};

function sanitizeText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .slice(0, 6000) // reduced: key CV info is always in the first ~3000 chars
    .trim();
}

async function downloadPdf(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from("curriculos")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL assinada: ${error?.message}`);
  }

  const response = await fetchWithTimeout(data.signedUrl, {}, 30_000);
  if (!response.ok) {
    throw new Error(`Erro ao baixar PDF. HTTP Status: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

const processor = async (job: Job) => {
  const rawData = job.data as Record<string, unknown>;
  const candidateId = rawData.candidateId as string || rawData.candidate_id as string;
  const storagePath = rawData.storagePath as string || rawData.storage_path as string;
  const vagaId = (rawData.vagaId as string) || (rawData.vaga_id as string) || (rawData.vaga as string);
  const batchId = (rawData.batchId as string) || (rawData.batch_id as string);

  const jobStart = Date.now();
  console.info(`[Worker] start job ${job.id}`, { candidateId, vagaId, batchId });
  try {
    const pdfBuffer = await downloadPdf(storagePath);
    const pdfData = await pdfParse(pdfBuffer);
    const cvText = sanitizeText(pdfData.text);

    const { data: criteriaData, error: critError } = await supabaseAdmin
      .from("criteria")
      .select("id,nome,peso,description,weight")
      .eq("vaga_id", vagaId);

    if (critError || !criteriaData?.length) {
      throw new Error(`Nenhum criterio cadastrado para vaga ${vagaId}`);
    }

    // Normalize: support legacy rows (description/weight) and new rows (nome/peso)
    const formattedCriteria = criteriaData
      .map((c) => ({
        id: c.id,
        name: (c.nome || c.description || "").trim(),
        weight: c.peso ?? c.weight ?? 3,
      }))
      .filter((c) => c.name); // skip rows with no name at all

    
    const prompt = buildScoringPrompt(cvText, formattedCriteria);
    const aiStart = Date.now();
    const jsonString = await callAI(prompt);
    const aiDuration = Date.now() - aiStart;
    console.info(`[Worker] AI call duration ms: ${aiDuration}`, { jobId: job.id, candidateId });
    const cleanJsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJsonString) as ScoringResult;

    if (typeof result.score_final !== "number" || !Array.isArray(result.criterios)) {
      throw new Error("Formato JSON retornado pela IA e invalido.");
    }

    const safeScoreFinal = Math.max(1.0, Math.min(5.0, Number(result.score_final)));
    const safeCriterios = result.criterios.map((criteria) => ({
      ...criteria,
      nota: Math.max(1.0, Math.min(5.0, Number(criteria.nota))),
    }));
    const candidatoNome = result.nome || "Candidato sem nome";

    // Build update payload — save all fields extracted by the AI
    const candidateUpdate: Record<string, unknown> = {
      parsed_text: cvText,
      score_final: safeScoreFinal,
      nome_candidato: candidatoNome,
      status: 'concluido',
    };

    if (result.email) candidateUpdate.email_contato = result.email;
    if (result.telefone) candidateUpdate.telefone = result.telefone;
    if (result.linkedin) candidateUpdate.linkedin_url = result.linkedin;
    if (result.cidade) candidateUpdate.cidade = result.cidade;
    if (result.cargo_atual) candidateUpdate.cargo_atual = result.cargo_atual;
    if (result.empresa_atual) candidateUpdate.empresa_atual = result.empresa_atual;
    if (result.pretensao_salarial) candidateUpdate.pretensao_salarial = result.pretensao_salarial;
    if (result.disponibilidade) candidateUpdate.disponibilidade = result.disponibilidade;
    if (result.regime_preferido) candidateUpdate.regime_preferido = result.regime_preferido;
    if (result.resumo) candidateUpdate.resumo_ia = result.resumo;

    await supabaseAdmin
      .from("pdf_candidates")
      .update(candidateUpdate)
      .eq("id", candidateId);

    // Insert per-criteria evaluations
    const evaluationsToInsert = safeCriterios
      .map((criteria) => {
        const dbCrit = formattedCriteria.find((dbCriteria) => dbCriteria.name === criteria.nome);
        return {
          candidate_id: candidateId,
          criteria_id: dbCrit?.id,
          nota: criteria.nota,
          justificativa: criteria.justificativa,
        };
      })
      .filter((evaluation) => evaluation.criteria_id);

    if (evaluationsToInsert.length > 0) {
      await supabaseAdmin.from("candidate_evaluations").insert(evaluationsToInsert);
    }

    // Update batch progress
    const { data: batch } = await supabaseAdmin
      .from("pdf_batches")
      .select("processed_files,total_files")
      .eq("id", batchId)
      .single();

    if (batch) {
      const newProcessed = (batch.processed_files || 0) + 1;
      await supabaseAdmin
        .from("pdf_batches")
        .update({
          processed_files: newProcessed,
          status: newProcessed >= batch.total_files ? "completed" : "processing",
        })
        .eq("id", batchId);
    }

    console.info(`[Worker] job completed ${job.id}`, { candidateId, durationMs: Date.now() - jobStart, score: safeScoreFinal });
    return { success: true, score: safeScoreFinal };
  } catch (error) {
    console.error(`[Worker] Failed job ${job.id} for ${candidateId}:`, error);
    await supabaseAdmin
      .from("pdf_candidates")
      .update({ status: "erro" })
      .eq("id", candidateId);
    throw error;
  }
};

// PDF processing worker initialized
const conn = getRedisConnection();
if (conn) {
  const concurrency = Number(process.env.PDF_WORKER_CONCURRENCY || '3');
  console.info(`[Worker] starting pdf-processing worker concurrency=${concurrency}`);
  new Worker("pdf-processing", processor, {
    connection: conn as any,
    concurrency,
  });
}
