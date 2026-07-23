import "dotenv/config";

import { fetchWithTimeout } from "../lib/api";
import { callAI } from "../lib/ai-client";
import { getRedisConnection } from "../lib/queue";
import { buildScoringPrompt } from "../lib/scoring-prompt";
import { createClient } from "@supabase/supabase-js";
import { Job, Worker, type WorkerOptions, type ConnectionOptions } from "bullmq";

async function loadPdfParse() {
  const module = await import("pdf-parse/lib/pdf-parse.js");
  return module.default ?? module;
}

// ── Early-exit guards para variáveis de ambiente ausentes ──────────────
if (!process.env.REDIS_URL) {
  console.warn("[Worker] REDIS_URL não configurado — worker desativado.");
  process.exit(0);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Worker] SUPABASE_SERVICE_ROLE_KEY ausente — worker NÃO pode iniciar.");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("[Worker] NEXT_PUBLIC_SUPABASE_URL ausente — worker NÃO pode iniciar.");
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.warn("[Worker] GROQ_API_KEY não configurado — scoring por IA desativado, score padrão 3.0 será usado.");
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
    .slice(0, 12000) // aumentado de 6000 para 12000 para CVs longos
    .trim();
}

async function downloadPdf(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from("curriculos")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar URL assinada: ${error?.message}`);
  }

  const signedUrl = encodeURI(data.signedUrl);
  const response = await fetchWithTimeout(signedUrl, {}, 30_000);
  if (!response.ok) {
    throw new Error(`Erro ao baixar PDF. HTTP Status: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function incrementarCreditosPdf(empresaId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("incrementar_creditos_pdf", {
    p_empresa_id: empresaId,
  });
  if (error) {
    console.warn(`[Worker] Falha ao incrementar créditos para empresa ${empresaId}:`, error.message);
  }
}

async function resolvePdfStoragePath(candidateId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("pdf_candidates")
    .select("storage_path, file_url")
    .eq("id", candidateId)
    .single();

  if (error) {
    throw new Error(`Falha ao buscar caminho do PDF para candidato ${candidateId}: ${error.message}`);
  }

  const path = data?.storage_path || data?.file_url;
  if (!path) {
    throw new Error(`Nenhum storage_path/file_url disponível para candidato ${candidateId}`);
  }

  if (!data?.storage_path && data?.file_url) {
    await supabaseAdmin.from("pdf_candidates").update({ storage_path: data.file_url }).eq("id", candidateId);
  }

  return path;
}

const processor = async (job: Job) => {
  const rawData = job.data as Record<string, unknown>;
  const candidateId = (rawData.candidateId as string) || (rawData.candidate_id as string);
  const storagePath = (rawData.storagePath as string) || (rawData.storage_path as string) || null;
  const vagaId = (rawData.vagaId as string) || (rawData.vaga_id as string) || (rawData.vaga as string);
  const batchId = (rawData.batchId as string) || (rawData.batch_id as string);

  const jobStart = Date.now();
  console.info(`[Worker] start job ${job.id}`, { candidateId, vagaId, batchId });

  // ── PASSO 1: Marca como processando ─────────────────────────────────
  await supabaseAdmin
    .from("pdf_candidates")
    .update({ status: "processando" })
    .eq("id", candidateId);

  try {
    // ── PASSO 2: Download do PDF ─────────────────────────────────────
    const effectiveStoragePath = storagePath || (await resolvePdfStoragePath(candidateId));
    const pdfBuffer = await downloadPdf(effectiveStoragePath);

    // ── PASSO 3: Extração de texto ───────────────────────────────────
    const pdfParse = await loadPdfParse();
    const pdfData = await pdfParse(pdfBuffer);

    // ── PASSO 4: Sanitização do texto ────────────────────────────────
    const cvText = sanitizeText(pdfData.text);

    if (!cvText || cvText.length < 50) {
      throw new Error("PDF sem texto suficiente (pode ser imagem escaneada)");
    }

    // ── PASSO 5: Busca critérios da vaga ────────────────────────────
    const { data: criteriaData, error: critError } = await supabaseAdmin
      .from("criteria")
      .select("id,nome,peso,description,weight")
      .eq("vaga_id", vagaId);

    // Normaliza: suporta colunas legadas (description/weight) e novas (nome/peso)
    const formattedCriteria = (criteriaData || [])
      .map((c) => ({
        id: c.id,
        name: (c.nome || c.description || "").trim(),
        weight: c.peso ?? c.weight ?? 3,
      }))
      .filter((c) => c.name);

    const hasCriteria = !critError && formattedCriteria.length > 0;

    let safeScoreFinal = 3.0;
    let candidatoNome = "Candidato sem nome";
    let safeCriterios: { nome: string; nota: number; justificativa?: string }[] = [];
    const extraFields: Record<string, string | null> = {};

    // Build unified prompt
    const prompt = hasCriteria
      ? buildScoringPrompt(cvText, formattedCriteria)
      : `Analise o currículo abaixo e extraia as informações do candidato. Retorne SOMENTE JSON válido (sem markdown, sem texto extra).

CURRÍCULO:
${cvText.slice(0, 4000)}

Retorne EXATAMENTE este JSON (preencha com null se não encontrar):
{"nome":"nome completo","email":null,"telefone":null,"linkedin":null,"cidade":null,"cargo_atual":null,"empresa_atual":null,"pretensao_salarial":null,"disponibilidade":"A combinar","regime_preferido":null,"resumo":"resumo breve do perfil"}`;

    // Call AI with robust parsing
    let aiResult: Record<string, unknown> | null = null;
    try {
      const aiStart = Date.now();
      const jsonString = await callAI(prompt);
      console.info(`[Worker] AI call duration ms: ${Date.now() - aiStart}`, { jobId: job.id, candidateId });

      let cleaned = jsonString.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      aiResult = JSON.parse(cleaned);
    } catch (aiErr) {
      console.warn(`[Worker] AI call/parse failed:`, aiErr instanceof Error ? aiErr.message : String(aiErr));
      // Regex fallback
      aiResult = {
        email: cvText.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || null,
        telefone: cvText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/)?.[0] || null,
        linkedin: cvText.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] ? `https://${cvText.match(/linkedin\.com\/in\/[\w-]+/i)![0]}` : null,
        resumo: cvText.slice(0, 300).replace(/\n/g, " ").trim(),
        disponibilidade: "A combinar",
      };
      const firstLine = cvText.split("\n").find((l) => l.trim().length > 3 && l.trim().length < 80);
      if (firstLine) aiResult.nome = firstLine.trim().slice(0, 60);
    }

    if (aiResult) {
      candidatoNome = String(aiResult.nome || aiResult.name || "Candidato sem nome");

      if (hasCriteria) {
        const rawScore = aiResult.score_final ?? aiResult.score ?? aiResult.nota_final;
        if (rawScore != null) {
          const parsed = Number(rawScore);
          if (!isNaN(parsed)) safeScoreFinal = Math.max(1.0, Math.min(5.0, parsed));
        }
        const rawCriterios = aiResult.criterios || aiResult.criteria || [];
        if (Array.isArray(rawCriterios)) {
          safeCriterios = rawCriterios
            .map((c: Record<string, unknown>) => ({
              nome: String(c.nome || c.name || ""),
              nota: Math.max(1.0, Math.min(5.0, Number(c.nota || c.score || 3))),
              justificativa: String(c.justificativa || c.justification || ""),
            }))
            .filter((c: { nome: string }) => c.nome);
        }
      }

      const fieldMap: [string, string][] = [
        ["email", "email_contato"], ["telefone", "telefone"], ["linkedin", "linkedin_url"],
        ["cidade", "cidade"], ["cargo_atual", "cargo_atual"], ["empresa_atual", "empresa_atual"],
        ["pretensao_salarial", "pretensao_salarial"], ["disponibilidade", "disponibilidade"],
        ["regime_preferido", "regime_preferido"], ["resumo", "resumo_ia"],
      ];
      for (const [src, dest] of fieldMap) {
        const val = aiResult[src];
        if (val != null && String(val).trim()) extraFields[dest] = String(val);
      }
    }

    // ── PASSO 9: UPDATE pdf_candidates ──────────────────────────────
    const candidateUpdate: Record<string, unknown> = {
      parsed_text: cvText,
      score_final: safeScoreFinal,
      nome_candidato: candidatoNome,
      status: "concluido",
    };

    // Merge extra fields extracted by AI into the update
    for (const [key, value] of Object.entries(extraFields)) {
      if (value) candidateUpdate[key] = value;
    }

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
        .upsert(evaluationsToInsert, { onConflict: "candidate_id,criteria_id" });
    }

    // ── PASSO 11: Incrementar progresso do batch via RPC ─────────────
    if (batchId) {
      await supabaseAdmin.rpc("incrementar_batch_processado", {
        p_candidate_id: candidateId,
      });
    }

    // ── PASSO 12: Incrementar créditos da empresa ────────────────────
    const { data: candidateRecord } = await supabaseAdmin
      .from("pdf_candidates")
      .select("empresa_id")
      .eq("id", candidateId)
      .single();

    if (candidateRecord?.empresa_id) {
      await incrementarCreditosPdf(candidateRecord.empresa_id);
    }

    const duration = ((Date.now() - jobStart) / 1000).toFixed(1);
    console.info(`[Worker] ✅ ${candidateId} | score: ${safeScoreFinal} | ${duration}s`);
    return { success: true, score: safeScoreFinal };
  } catch (error) {
    // ── PASSO 13: Em qualquer erro → UPDATE status='erro' ───────────
    console.error(`[Worker] ❌ ${candidateId}:`, error instanceof Error ? error.message : error);
    await supabaseAdmin
      .from("pdf_candidates")
      .update({ status: "erro" })
      .eq("id", candidateId);
    throw error; // re-throw para BullMQ gerenciar retries
  }
};

// ── Inicializa o worker com concurrency=10, limiter 50/min, retries=3 ──
const conn = getRedisConnection();
if (conn) {
  const concurrency = Number(process.env.PDF_WORKER_CONCURRENCY || "10");
  console.info(`[Worker] 🚀 starting pdf-processing worker concurrency=${concurrency} | meta: 30+ CVs/min`);
  const workerOptions: WorkerOptions = {
    connection: conn as ConnectionOptions,
    concurrency,
    limiter: {
      max: 50,
      duration: 60_000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 },
  };

  const worker = new Worker("pdf-processing", processor, workerOptions);

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} concluído`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} falhou:`, err.message);
  });
} else {
  console.warn("[Worker] Redis não disponível — worker não iniciado.");
}
