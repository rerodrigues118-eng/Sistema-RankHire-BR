import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ApiError, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/auth";
import { incrementLoginAttempt, isIpBlocked, resetLoginAttempts } from "@/lib/login-attempts";
import { logAdminAction } from "@/lib/log";
import { createAdminSession, getSessionCookieName } from "@/lib/session";

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
      .select("id,nome,email,senha_hash,role,ativo")
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

    const userAgent = request.headers.get("user-agent") || "unknown";
    const sessionToken = await createAdminSession(user.id, ip, userAgent);
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: getSessionCookieName(),
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
    });

    await logAdminAction({
      adminId: user.id,
      acao: "login_admin",
      nivel: "INFO",
      ipAddress: ip,
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
