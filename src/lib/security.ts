import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

// Secret key for PII hashing/encryption (defaults to fallback if env missing)
const SECURITY_SECRET = process.env.SECURITY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "rankhire-br-sec-secret-2026-key";

/**
 * Anonymize PII email for public view or LGPD storage
 * Example: mateus.rodrigues@empresa.com -> m***s@e***a.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "Acesso Restrito (LGPD)";
  const [local, domain] = email.split("@");
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0].length > 2
    ? `${domainParts[0][0]}***${domainParts[0][domainParts[0].length - 1]}`
    : `${domainParts[0][0]}***`;
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join(".")}`;
}

/**
 * Anonymize Phone for public view or LGPD storage
 * Example: +55 41 99888-7766 -> +55 (41) 9****-**66
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 8) return "Número Restrito (LGPD)";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "Número Restrito (LGPD)";
  const last4 = digits.slice(-4);
  return `+55 (**) 9****-${last4}`;
}

/**
 * Cryptographic hash for candidate PII deduplication without storing raw plain text
 */
export function hashPII(value: string): string {
  return crypto.createHmac("sha256", SECURITY_SECRET).update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Sanitizes input string against XSS injection
 */
export function sanitizeXSS(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export interface AuditLogPayload {
  userId: string;
  empresaId?: string;
  action: "VIEW_CANDIDATE" | "EXPORT_PDF" | "UPDATE_STATUS" | "LGPD_FORGET" | "AI_ENRICH";
  resourceId: string;
  resourceType: "candidate" | "job" | "export";
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write a secure audit log for LGPD compliance and OWASP access tracking
 */
export async function logAuditAccess(payload: AuditLogPayload) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: payload.userId,
      empresa_id: payload.empresaId || null,
      action: payload.action,
      resource_id: payload.resourceId,
      resource_type: payload.resourceType,
      details: payload.details ? JSON.stringify(payload.details) : null,
      ip_address: payload.ipAddress || "127.0.0.1",
      user_agent: payload.userAgent || "Unknown",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[Audit Log Warning] Failed to persist audit entry:", error.message);
    }
  } catch (err) {
    console.error("[Audit Log Error]", err);
  }
}
