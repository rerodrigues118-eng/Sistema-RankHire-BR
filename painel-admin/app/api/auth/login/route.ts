import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ApiError, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/auth";
import { incrementLoginAttempt, isIpBlocked, resetLoginAttempts } from "@/lib/login-attempts";
import { logAdminAction } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = rateLimit(ip);
    if (!rate.ok) {
      return NextResponse.json({ error: "Rate limit atingido. Aguarde um minuto." }, { status: 429 });
    }

    const blocked = await isIpBlocked(ip);
    if (blocked) {
      return NextResponse.json({ error: "IP bloqueado temporariamente. Tente novamente mais tarde." }, { status: 429 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      throw new ApiError("Email e senha são obrigatórios.", 400);
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error } = await admin
      .from("admin_usuarios")
      .select("id,nome,email,senha_hash,role,ativo,totp_enabled,totp_secret")
      .eq("email", email)
      .single();

    if (error || !user) {
      await incrementLoginAttempt(ip);
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    if (!user.ativo) {
      return NextResponse.json({ error: "Conta de administrador inativa." }, { status: 403 });
    }

    if (!verifyPassword(password, user.senha_hash)) {
      const attempt = await incrementLoginAttempt(ip);
      const message = attempt.attempts >= 3
        ? "Muitas tentativas. IP bloqueado por 30 minutos."
        : `Credenciais inválidas. Restam ${3 - attempt.attempts} tentativas.`;
      await logAdminAction({
        adminId: null,
        acao: "login_falhou",
        nivel: "WARN",
        ipAddress: ip,
        dadosDepois: { email, attempts: attempt.attempts },
      });
      return NextResponse.json({ error: message }, { status: 401 });
    }

    await resetLoginAttempts(ip);

    const requires2fa = Boolean(user.totp_enabled);
    const needsSetup = !user.totp_enabled;
    await logAdminAction({
      adminId: user.id,
      acao: "login_tentativa",
      nivel: "INFO",
      ipAddress: ip,
      dadosDepois: { requires2fa, needsSetup },
    });

    return NextResponse.json({
      adminId: user.id,
      requires2fa,
      needsSetup,
      email: user.email,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
