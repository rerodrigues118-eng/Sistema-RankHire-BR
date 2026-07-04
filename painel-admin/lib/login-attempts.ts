import { createSupabaseAdminClient } from "@/lib/supabase";

const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_MINUTES = 30;

export type LoginAttemptRow = {
  ip: string;
  attempts: number;
  blocked_until: string | null;
  updated_at: string | null;
};

export async function getLoginAttempt(ip: string): Promise<LoginAttemptRow | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_login_attempts")
    .select("ip,attempts,blocked_until,updated_at")
    .eq("ip", ip)
    .single();

  if (error || !data) {
    return null;
  }

  return data as LoginAttemptRow;
}

export async function incrementLoginAttempt(ip: string) {
  const admin = createSupabaseAdminClient();
  const attempt = await getLoginAttempt(ip);
  const now = new Date();
  const nextAttempts = (attempt?.attempts || 0) + 1;
  const blockedUntil = nextAttempts >= MAX_LOGIN_ATTEMPTS
    ? new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000).toISOString()
    : null;

  const { error } = await admin.from("admin_login_attempts").upsert({
    ip,
    attempts: nextAttempts,
    blocked_until: blockedUntil,
    updated_at: now.toISOString(),
  }, { onConflict: ["ip"] });

  if (error) {
    throw new Error(error.message);
  }

  return { attempts: nextAttempts, blockedUntil };
}

export async function resetLoginAttempts(ip: string) {
  const admin = createSupabaseAdminClient();
  await admin.from("admin_login_attempts").delete().eq("ip", ip);
}

export async function isIpBlocked(ip: string) {
  const attempt = await getLoginAttempt(ip);
  if (!attempt?.blocked_until) {
    return false;
  }

  return new Date(attempt.blocked_until) > new Date();
}

export function getLoginAttemptStatus(attempts: number) {
  return {
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts),
    max: MAX_LOGIN_ATTEMPTS,
  };
}
