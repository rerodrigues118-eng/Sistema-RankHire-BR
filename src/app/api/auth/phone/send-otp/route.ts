import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/admin";
import { handleApiError } from "@/lib/api";

const BR_PHONE_REGEX = /^\+55[1-9]{2}[6-9]\d{8}$/;

export async function POST(req: Request) {
  try {
    const { telefone } = (await req.json()) as { telefone?: string };
    const digits = telefone?.replace(/\D/g, "") || "";
    const phone = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;

    if (!BR_PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Informe um celular brasileiro válido no formato +55DDDnumero." },
        { status: 400 }
      );
    }

    // 1. Passo 1: Verificar se telefone já existe no banco de dados
    const admin = createSupabaseAdminClient();
    const { data: usuarioExistente } = await admin
      .from("usuarios")
      .select("id")
      .eq("telefone", phone)
      .maybeSingle();

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Este número de telefone já está cadastrado em outra conta." },
        { status: 400 }
      );
    }

    // 2. Passo 2: Twilio Verify API (SMS OTP)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      // Fallback para desenvolvimento sem Twilio configurado
      console.warn("[Twilio OTP] Variáveis TWILIO_* não configuradas. Simulando envio.");
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Código de verificação enviado com sucesso (simulado).",
      });
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", phone);
    params.append("Channel", "sms");

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("[Twilio Verify Error]:", twilioData);
      return NextResponse.json(
        { error: twilioData.message || "Erro ao enviar SMS de verificação pelo Twilio." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: twilioData.status,
      message: "Código de verificação enviado via SMS.",
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
