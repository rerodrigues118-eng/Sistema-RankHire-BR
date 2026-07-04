import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ApiError, handleApiError } from "@/lib/api";
import { verifyTotpToken } from "@/lib/auth";
import { createAdminSession, getSessionCookieName } from "@/lib/session";
import { logAdminAction } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json();
    const adminId = String(body.adminId || "").trim();
    const token = String(body.token || "").trim();
    if (!adminId || !token) {
      throw new ApiError("ID do admin e código 2FA são obrigatórios.", 400);
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error } = await admin
      .from("admin_usuarios")
      .select("id,email,totp_secret,totp_enabled,ativo")
      .eq("id", adminId)
      .single();

    if (error || !user) {
      throw new ApiError("Administrador não encontrado.", 404);
    }

    if (!user.ativo) {
      throw new ApiError("Administrador inativo.", 403);
    }

    if (!user.totp_enabled || !user.totp_secret) {
      throw new ApiError("2FA não configurado para este usuário.", 400);
    }

    if (!verifyTotpToken(user.totp_secret, token)) {
      await logAdminAction({
        adminId: user.id,
        acao: "login_2fa_falhou",
        nivel: "WARN",
        ipAddress: ip,
      });
      return NextResponse.json({ error: "Código 2FA inválido." }, { status: 401 });
    }

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
