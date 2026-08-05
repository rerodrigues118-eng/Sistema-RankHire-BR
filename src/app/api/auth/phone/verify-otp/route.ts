import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";

const BR_PHONE_REGEX = /^\+55[1-9]{2}[6-9]\d{8}$/;

export async function POST(req: Request) {
  try {
    const { telefone, code } = (await req.json()) as { telefone?: string; code?: string };
    const digits = telefone?.replace(/\D/g, "") || "";
    const phone = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;

    if (!BR_PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 }
      );
    }

    if (!code || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "O código de verificação deve possuir 6 dígitos." },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    // Fallback de desenvolvimento caso Twilio não esteja configurado no .env
    if (!accountSid || !authToken || !verifyServiceSid) {
      if (code.trim() === "123456" || code.trim() === "000000") {
        return NextResponse.json({ success: true, verified: true, simulated: true });
      }
      return NextResponse.json(
        { error: "Código incorreto (Simulado: use 123456 ou 000000)." },
        { status: 400 }
      );
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", phone);
    params.append("Code", code.trim());

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok || twilioData.status !== "approved") {
      return NextResponse.json(
        { error: "Código de verificação incorreto ou expirado." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
