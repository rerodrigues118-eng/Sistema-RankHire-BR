import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { ApiError, handleApiError } from "@/lib/api";
import { generateTotpSecret, verifyTotpToken } from "@/lib/auth";
import { createAdminSession, getSessionCookieName } from "@/lib/session";
import { logAdminAction } from "@/lib/log";

const APP_NAME = "RankHire BR Admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const adminId = url.searchParams.get("adminId") || "";
    if (!adminId) {
      throw new ApiError("adminId é obrigatório.", 400);
    }

    const admin = createSupabaseAdminClient();
    const { data: user, error } = await admin
      .from("admin_usuarios")
      .select("id,email,totp_secret,totp_enabled")
      .eq("id", adminId)
      .single();

    if (error || !user) {
      throw new ApiError("Administrador não encontrado.", 404);
    }

    if (user.totp_enabled && user.totp_secret) {
      return NextResponse.json({ needsSetup: false, email: user.email });
    }

    const secret = user.totp_secret || generateTotpSecret();
    const { error: updateError } = await admin
      .from("admin_usuarios")
      .update({ totp_secret: secret })
      .eq("id", adminId);

    if (updateError) {
      throw new ApiError(updateError.message, 500);
    }

    const otpauth = authenticator.keyuri(user.email, APP_NAME, secret);
    return NextResponse.json({ email: user.email, secret, otpauth });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json();
    const adminId = String(body.adminId || "").trim();
    const token = String(body.token || "").trim();

    if (!adminId || !token) {
      throw new ApiError("adminId e código de verificação são obrigatórios.", 400);
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

    if (!user.totp_secret) {
      throw new ApiError("Secret 2FA não configurado.", 400);
    }

    if (!verifyTotpToken(user.totp_secret, token)) {
      return NextResponse.json({ error: "Código de configuração inválido." }, { status: 401 });
    }

    const { error: updateError } = await admin
      .from("admin_usuarios")
      .update({ totp_enabled: true })
      .eq("id", adminId);

    if (updateError) {
      throw new ApiError(updateError.message, 500);
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
      acao: "2fa_configurado",
      nivel: "INFO",
      ipAddress: ip,
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
