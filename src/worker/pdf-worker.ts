import 'dotenv/config';

import { fetchWithTimeout } from "../lib/api";
import { callAI } from "../lib/ai-client";
import { getRedisConnection } from "../lib/queue";
import { buildScoringPrompt } from "../lib/scoring-prompt";
import { createClient } from "@supabase/supabase-js";
import { Job, Worker, type WorkerOptions, type ConnectionOptions } from "bullmq";

import pdfParse from 'pdf-parse';

// ── Early-exit guards para variáveis de ambiente ausentes ──────────────
if (!process.env.REDIS_URL) {
  console.warn('[Worker] REDIS_URL não configurado — worker desativado.');
  process.exit(0);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Worker] SUPABASE_SERVICE_ROLE_KEY ausente — worker NÃO pode iniciar.');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[Worker] NEXT_PUBLIC_SUPABASE_URL ausente — worker NÃO pode iniciar.');
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.warn('[Worker] GROQ_API_KEY não configurado — scoring por IA desativado, score padrão 3.0 será usado.');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
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
    .slice(0, 6000)
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

async function incrementarCreditosPdf(empresaId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('incrementar_creditos_pdf', {
    p_empresa_id: empresaId,
  });
  if (error) {
    // Não bloqueia o fluxo principal, apenas loga o aviso
    console.warn(`[Worker] Falha ao incrementar créditos para empresa ${empresaId}:`, error.message);
  }
}

const processor = async (job: Job) => {
  const rawData = job.data as Record<string, unknown>;
  const candidateId = rawData.candidateId as string || rawData.candidate_id as string;
  const storagePath = rawData.storagePath as string || rawData.storage_path as string;
  const vagaId = (rawData.vagaId as string) || (rawData.vaga_id as string) || (rawData.vaga as string);
  const batchId = (rawData.batchId as string) || (rawData.batch_id as string);

  const jobStart = Date.now();
  console.info(`[Worker] start job ${job.id}`, { candidateId, vagaId, batchId });

  // ── PASSO 1: Marca como processando ─────────────────────────────────
  await supabaseAdmin
    .from("pdf_candidates")
    .update({ status: 'processando' })
    .eq("id", candidateId);

  try {
    // ── PASSO 2: Download do PDF ─────────────────────────────────────
    const pdfBuffer = await downloadPdf(storagePath);

    // ── PASSO 3: Extração de texto ───────────────────────────────────
    const pdfData = await pdfParse(pdfBuffer);

    // ── PASSO 4: Sanitização do texto ────────────────────────────────
    const cvText = sanitizeText(pdfData.text);

    // ── PASSO 5: Busca critérios da vaga ────────────────────────────
    const { data: criteriaData, error: critError } = await supabaseAdmin
      .from("criteria")
      .select("id,nome,peso,description,weight")
      .eq("vaga_id", vagaId);

    if (critError || !criteriaData?.length) {
      throw new Error(`Nenhum criterio cadastrado para vaga ${vagaId}`);
    }

    // Normaliza: suporta colunas legadas (description/weight) e novas (nome/peso)
    const formattedCriteria = criteriaData
      .map((c) => ({
        id: c.id,
        name: (c.nome || c.description || "").trim(),
        weight: c.peso ?? c.weight ?? 3,
      }))
      .filter((c) => c.name);

    // ── PASSO 6: Chama IA com timeout de 30s ────────────────────────
    const prompt = buildScoringPrompt(cvText, formattedCriteria);
    const aiStart = Date.now();
    const jsonString = await callAI(prompt);
    const aiDuration = Date.now() - aiStart;
    console.info(`[Worker] AI call duration ms: ${aiDuration}`, { jobId: job.id, candidateId });

    // ── PASSO 7: Parse e valida JSON ────────────────────────────────
    const cleanJsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJsonString) as ScoringResult;

    if (typeof result.score_final !== "number" || !Array.isArray(result.criterios)) {
      throw new Error("Formato JSON retornado pela IA e invalido.");
    }

    // ── PASSO 8: Normaliza scores ────────────────────────────────────
    const safeScoreFinal = Math.max(1.0, Math.min(5.0, Number(result.score_final)));
    const safeCriterios = result.criterios.map((criteria) => ({
      ...criteria,
      nota: Math.max(1.0, Math.min(5.0, Number(criteria.nota))),
    }));
    const candidatoNome = result.nome || "Candidato sem nome";

    // ── PASSO 9: UPDATE pdf_candidates ──────────────────────────────
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

    // ── PASSO 10: UPSERT candidate_evaluations ──────────────────────
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
      await supabaseAdmin
        .from("candidate_evaluations")
        .upsert(evaluationsToInsert, { onConflict: 'candidate_id,criteria_id' });
    }

    // ── PASSO 11: Incrementar progresso do batch ─────────────────────
    const { data: batch } = await supabaseAdmin
      .from("pdf_batches")
      .select("processed_files,total_files,empresa_id")
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

      // ── PASSO 12: Incrementar créditos da empresa ────────────────
      if (batch.empresa_id) {
        await incrementarCreditosPdf(batch.empresa_id);
      }
    }

    console.info(`[Worker] job completed ${job.id}`, { candidateId, durationMs: Date.now() - jobStart, score: safeScoreFinal });
    return { success: true, score: safeScoreFinal };
  } catch (error) {
    // ── PASSO 13: Em qualquer erro → UPDATE status='erro' ───────────
    console.error(`[Worker] Failed job ${job.id} for ${candidateId}:`, error);
    await supabaseAdmin
      .from("pdf_candidates")
      .update({ status: "erro" })
      .eq("id", candidateId);
    throw error; // re-throw para BullMQ gerenciar retries
  }
};

// ── Inicializa o worker com concurrency=5, retries=3, backoff exponencial ──
const conn = getRedisConnection();
if (conn) {
  const concurrency = Number(process.env.PDF_WORKER_CONCURRENCY || '5');
  console.info(`[Worker] starting pdf-processing worker concurrency=${concurrency}`);
  const workerOptions: WorkerOptions = {
    connection: conn as ConnectionOptions,
    concurrency,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  };

  new Worker("pdf-processing", processor, workerOptions);
} else {
  console.warn('[Worker] Redis não disponível — worker não iniciado.');
}
