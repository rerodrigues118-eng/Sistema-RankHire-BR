const { Queue } = require("bullmq");
require("dotenv").config();

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

const connection = parseRedisUrl(process.env.REDIS_URL);
const queue = new Queue("pdf-processing", { connection });

async function run() {
  console.log("=== QUEUE CHECK ===");
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    console.log("Waiting:", waiting);
    console.log("Active:", active);
    console.log("Completed:", completed);
    console.log("Failed:", failed);
    console.log("Delayed:", delayed);

    const jobs = await queue.getJobs(["waiting", "active", "failed", "completed"]);
    console.log(`\nFetched ${jobs.length} jobs details:`);
    for (const job of jobs) {
      console.log(`- Job ID: ${job.id}, Name: ${job.name}, Status: ${await job.getState()}`);
      console.log(`  Data:`, job.data);
      if (job.failedReason) {
        console.log(`  Failed Reason:`, job.failedReason);
      }
      if (job.returnvalue) {
        console.log(`  Return Value:`, job.returnvalue);
      }
    }
  } catch (error) {
    console.error("Error inspecting queue:", error);
  } finally {
    await queue.close();
  }
}

run();
