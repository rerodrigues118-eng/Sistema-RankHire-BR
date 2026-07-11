import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// lightweight UUID v4 generator (no external dependency)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const args = process.argv.slice(2);
const DRY = args.includes('--dry') || process.env.DRY_RUN === '1';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const redisUrl = process.env.REDIS_URL;
  const vagaId = process.env.TEST_VAGA_ID || null;
  const empresaId = process.env.TEST_EMPRESA_ID || null;
  const batchSize = Number(process.env.SIM_BATCH_SIZE || '3');
  const batches = Number(process.env.SIM_BATCHES || '5');

  let supabase: any = null;
  let queue: Queue | null = null;

  if (!DRY) {
    if (!url || !serviceKey) {
      console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or run with --dry)');
      process.exit(1);
    }

    supabase = createClient(url, serviceKey);

    if (redisUrl) {
      const conn = new IORedis(redisUrl);
      queue = new Queue('pdf-processing', { connection: conn as any });
    }
  } else {
    console.log('DRY RUN: Simulação sem conectar a Supabase/Redis');
  }

  console.log(`Simulating ${batches} batches x ${batchSize} candidates`);

  for (let b = 0; b < batches; b++) {
    const batchId = uuidv4();
    const now = new Date().toISOString();
    const totalFiles = batchSize;

    if (!DRY) {
      const { error: batchErr } = await supabase.from('pdf_batches').insert({
        id: batchId,
        vaga_id: vagaId,
        empresa_id: empresaId,
        total_files: totalFiles,
        processed_files: 0,
        status: 'processing',
        created_at: now,
      });

      if (batchErr) {
        console.error('Failed to insert batch', batchErr.message);
        continue;
      }
    } else {
      console.log(`[DRY] would insert batch ${batchId} (total ${totalFiles})`);
    }

    const candidatesData = [] as any[];
    for (let i = 0; i < batchSize; i++) {
      const id = uuidv4();
      const fileUrl = `tests/sample-${b}-${i}.pdf`;
      candidatesData.push({
        id,
        batch_id: batchId,
        vaga_id: vagaId,
        empresa_id: empresaId,
        file_url: fileUrl,
        status: 'queued',
        created_at: now,
      });
    }

    if (!DRY) {
      const { error: candErr } = await supabase.from('pdf_candidates').insert(candidatesData);
      if (candErr) {
        console.error('Failed to insert candidates', candErr.message);
        continue;
      }

      console.log(`Inserted batch ${batchId} with ${candidatesData.length} candidates`);

      if (queue) {
        try {
          await Promise.all(candidatesData.map((cand) => queue!.add('pdf-process', {
            candidateId: cand.id,
            storagePath: cand.file_url,
            vaga_id: cand.vaga_id,
            batchId: cand.batch_id,
          })));
          console.log('Enqueued jobs to Redis for batch', batchId);
        } catch (qerr) {
          console.error('Failed to enqueue jobs', qerr);
        }
      }
    } else {
      console.log(`Inserted batch ${batchId} with ${candidatesData.length} candidates (DRY)`);
      console.log(`Would enqueue ${candidatesData.length} jobs for batch ${batchId} (DRY)`);
    }

    // small pause between batches
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('Simulation complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Simulation error', err);
  process.exit(1);
});
