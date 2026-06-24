import { Queue } from "bullmq";

// Forçar carregamento do .env antes da inicialização
require("dotenv").config();

/**
 * Parseia a REDIS_URL (ex: rediss://user:pass@host:6379)
 * e retorna um objeto de opções compatível com o ioredis
 * INTERNO do BullMQ — evitando conflito de versões.
 */
function parseRedisUrl(url: string) {
  const u = new URL(url);
  const isTLS = url.startsWith("rediss://");
  return {
    host: u.hostname,
    port: parseInt(u.port || "6379", 10),
    password: u.password ? decodeURIComponent(u.password) : undefined,
    username: u.username && u.username !== "default" ? u.username : undefined,
    tls: isTLS ? {} : undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}

export const redisConnection = parseRedisUrl(process.env.REDIS_URL!);

// Fila BullMQ Producer
export const pdfQueue = new Queue("pdf-processing", {
  connection: redisConnection,
});
