import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

const BR_PHONE_REGEX = /^\+55[1-9]{2}[6-9]\d{8}$/;

export async function POST(req: Request) {
  try {
    const { telefone } = (await req.json()) as { telefone?: string };
    const normalizedPhone = telefone?.replace(/\D/g, "");
    const phone = normalizedPhone ? `+${normalizedPhone}` : "";

    if (!BR_PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Informe um telefone brasileiro valido no formato +55DDDnumero." },
        { status: 400 },
      );
    }

    // admin-client: justificado — verificação que pode requerer privilégios de leitura ampliada
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("usuarios")
      .select("id")
      .eq("telefone", phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ available: !data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
