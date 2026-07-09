import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import 'dotenv/config';

function parseRedisUrl(url) {
  const u = new URL(url);
  const isTLS = url.startsWith("rediss://");
  return {
    host: u.hostname,
    port: parseInt(u.port || "6379", 10),
    password: u.password ? decodeURIComponent(u.password) : undefined,
    username: u.username && u.username !== "default" ? u.username : undefined,
    tls: isTLS ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const connection = parseRedisUrl(process.env.REDIS_URL);
const queue = new Queue("pdf-processing", { connection });

async function run() {
  console.log("=== REQUEUING UNPROCESSED CANDIDATES ===");
  try {
    const { data: candidates, error: errCandidates } = await supabase
      .from("pdf_candidates")
      .select("id, vaga_id, file_url, batch_id")
      .is("nome_candidato", null);

    if (errCandidates) {
      throw errCandidates;
    }

    console.log(`Found ${candidates?.length || 0} candidates with null name in DB.`);

    if (!candidates || candidates.length === 0) {
      console.log("No candidates need reprocessing.");
      return;
    }

    const jobs = candidates.map((c) => ({
      name: "extract-and-score-pdf",
      data: {
        candidateId: c.id,
        storagePath: c.file_url,
        vagaId: c.vaga_id,
        batchId: c.batch_id,
      },
    }));

    console.log(`Adding ${jobs.length} jobs to Redis queue...`);
    const addedJobs = await queue.addBulk(jobs);
    console.log(`Successfully enqueued ${addedJobs.length} jobs.`);

    for (const job of addedJobs) {
      console.log(`- Job ID: ${job.id} for Candidate ID: ${job.data.candidateId}`);
    }
  } catch (error) {
    console.error("Error enqueuing candidates:", error);
  } finally {
    await queue.close();
  }
}

run();
