import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/admin";
import { handleApiError } from "@/lib/api";

// Limiter em memória para rate limit por IP (5 requisições por hora)
const memoryLimiter = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitInfo = memoryLimiter.get(ip);

  if (!limitInfo) {
    memoryLimiter.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > limitInfo.resetTime) {
    memoryLimiter.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (limitInfo.count >= MAX_REQUESTS) {
    return true;
  }

  limitInfo.count += 1;
  return false;
}

export async function POST(req: Request) {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    // 1. Rate Limiting por IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Muitas requisições. Tente novamente mais tarde." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "3600",
          },
        }
      );
    }

    // 2. Extrair dados da requisição
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    // 3. Atualizar consentimento de marketing no banco de dados (Supabase Admin)
    const admin = createSupabaseAdminClient();
    
    // Verificamos se o usuário existe
    const { data: user, error: fetchError } = await admin
      .from("usuarios")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: "Erro ao buscar usuário." }, { status: 500 });
    }

    if (!user) {
      // Retornamos sucesso mesmo se o usuário não existir para evitar vazamento de e-mails (Data Harvesting)
      return NextResponse.json({ success: true, message: "Inscrição cancelada com sucesso." });
    }

    // Atualiza o consentimento
    const { error: updateError } = await admin
      .from("usuarios")
      .update({
        consentimento_marketing: false,
        consentimento_marketing_em: null,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Erro ao atualizar consentimento." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Inscrição cancelada com sucesso." });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
