const requests = new Map<string, { count: number; firstRequest: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

export function rateLimit(ip: string) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.firstRequest > 60_000) {
    requests.set(ip, { count: 1, firstRequest: now });
    return { ok: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: MAX_REQUESTS_PER_MINUTE - entry.count };
}

export function resetRateLimit(ip: string) {
  requests.delete(ip);
}
