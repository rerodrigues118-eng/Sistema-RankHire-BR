import dotenv from "dotenv";
dotenv.config();

import { Queue } from "bullmq";

function parseRedisUrl(url: string) {
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

async function run() {
  const conn = parseRedisUrl(process.env.REDIS_URL!);
  const queue = new Queue("pdf-processing", { connection: conn });
  
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  console.log('Queue counts:', counts);

  const activeJobs = await queue.getJobs(['active']);
  console.log(`Found ${activeJobs.length} active jobs. Moving them to wait/fail...`);
  
  // Since we restarted the worker, active jobs might be stalled. 
  // We can just try to clean them up or let the worker stall handler pick them up.
  // Actually, let's just wait to see if counts are printed.
  process.exit(0);
}

run().catch(console.error);
