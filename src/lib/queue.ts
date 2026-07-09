// NOTE: This module must NOT import 'dotenv/config' or attempt to instantiate
// bullmq Queues at module evaluation time — Next.js build-time bundling will
// try to resolve every top-level import and that breaks the build.
// All Queue/Redis creation is deferred to runtime inside getters.

type StubQueue = {
  add: (...args: unknown[]) => Promise<void>;
  addBulk: (...args: unknown[]) => Promise<void>;
};

let _pdfQueue: import("bullmq").Queue | StubQueue | null = null;
let _redisConnection: Record<string, unknown> | null = null;

function parseRedisUrl(url: string): Record<string, unknown> {
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

const stub: StubQueue = {
  add: async () => { throw new Error("Redis not configured"); },
  addBulk: async () => { throw new Error("Redis not configured"); },
};

export function getRedisConnection(): Record<string, unknown> | null {
  if (_redisConnection !== null) return _redisConnection;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    _redisConnection = parseRedisUrl(url);
    return _redisConnection;
  } catch {
    return null;
  }
}

export async function getPdfQueue(): Promise<import("bullmq").Queue | StubQueue> {
  if (_pdfQueue) return _pdfQueue;
  const conn = getRedisConnection();
  if (!conn) {
    _pdfQueue = stub;
    return stub;
  }
  try {
    const { Queue } = await import("bullmq");
    _pdfQueue = new Queue("pdf-processing", { connection: conn as any });
    return _pdfQueue;
  } catch {
    _pdfQueue = stub;
    return stub;
  }
}

// Synchronous accessor kept for backwards-compat with existing code that
// already initialises at module level (workers). Returns null if not yet ready.
export function getRedisConnectionSync() {
  return getRedisConnection();
}

// Legacy named exports for code that was already importing these names.
// They now return null until the queue is initialised lazily.
export const redisConnection = null;
export const pdfQueue = null;

