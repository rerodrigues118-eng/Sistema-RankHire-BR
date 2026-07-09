import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase";

const COOKIE_NAME = "rankhire_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function randomHex(bytes: number) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSessionToken() {
  return randomHex(32);
}

export function getSessionExpiration(): string {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}

export async function createAdminSession(adminId: string, ip: string, userAgent: string) {
  const admin = createSupabaseAdminClient();
  const tokenId = randomHex(12);
  const tokenSecret = generateSessionToken();
  const tokenHash = bcrypt.hashSync(tokenSecret, 10);
  const expiresAt = getSessionExpiration();

  const { error } = await admin.from("admin_sessoes").insert({
    admin_id: adminId,
    token_id: tokenId,
    token_hash: tokenHash,
    ip,
    user_agent: userAgent,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return `${tokenId}.${tokenSecret}`;
}

export async function refreshAdminSession(sessionId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("admin_sessoes")
    .update({ expires_at: getSessionExpiration() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminSessionByToken(token: string) {
  const admin = createSupabaseAdminClient();
  const [tokenId, tokenSecret] = token.split(".");

  if (!tokenId || !tokenSecret) {
    return null;
  }

  const { data, error } = await admin
    .from("admin_sessoes")
    .select("id,admin_id,token_hash,expires_at")
    .eq("token_id", tokenId)
    .single();

  if (error || !data) {
    return null;
  }

  const valid = bcrypt.compareSync(tokenSecret, data.token_hash);
  if (!valid) {
    return null;
  }

  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  await refreshAdminSession(data.id);
  return data;
}

export async function invalidateAdminSession(token: string) {
  const admin = createSupabaseAdminClient();
  const [tokenId] = token.split(".");
  if (!tokenId) return;
  await admin.from("admin_sessoes").delete().eq("token_id", tokenId);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
