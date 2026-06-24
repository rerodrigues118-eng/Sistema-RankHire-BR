import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type OnboardingBody =
  | {
      step: "company";
      nome: string;
      email?: string;
      cargo?: string;
      telefone?: string;
      nomeEmpresa: string;
      cnpj?: string;
      tamanho?: string;
      segmento?: string;
      termosAceitos?: boolean;
      termosVersao?: string;
      consentimentoMarketing?: boolean;
    }
  | {
      step: "job";
      jobTitle: string;
      area?: string;
      contract?: string;
      location?: string;
      briefing?: string;
    };

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as OnboardingBody;
    const admin = createSupabaseAdminClient();

    const { data: usuarioAtual } = await admin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", user.id)
      .single();

    if (body.step === "company") {
      const normalizedPhone = body.telefone?.replace(/\D/g, "");
      const telefone = normalizedPhone ? `+${normalizedPhone}` : null;

      const empresaPayload = {
        nome: body.nomeEmpresa.trim(),
        cnpj: body.cnpj?.trim() || null,
        tamanho: body.tamanho || "1-10",
        segmento: body.segmento || "Tecnologia",
        plano: "trial_starter",
        trial_expires_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: "trialing",
      };

      const empresaId = usuarioAtual?.empresa_id ?? undefined;
      const { data: empresa, error: empresaError } = empresaId
        ? await admin
            .from("empresas")
            .update(empresaPayload)
            .eq("id", empresaId)
            .select("id,nome,plano,trial_expires_at")
            .single()
        : await admin
            .from("empresas")
            .insert(empresaPayload)
            .select("id,nome,plano,trial_expires_at")
            .single();

      if (empresaError || !empresa) {
        return NextResponse.json({ error: empresaError?.message || "Falha ao criar empresa" }, { status: 500 });
      }

      // Captura IP de cadastro
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

      const { error: userError } = await admin
        .from("usuarios")
        .upsert(
          {
            id: user.id,
            email: user.email ?? body.email?.trim() ?? null,
            nome: body.nome.trim(),
            telefone,
            cargo: body.cargo?.trim() || null,
            empresa_id: empresa.id,
            role: usuarioAtual?.role === "superadmin" ? "superadmin" : "admin",
            termos_aceitos_em: body.termosAceitos ? new Date().toISOString() : null,
            termos_versao: body.termosAceitos ? (body.termosVersao || "v2.0-2026-06") : null,
            consentimento_marketing: body.consentimentoMarketing ?? false,
            consentimento_marketing_em: body.consentimentoMarketing ? new Date().toISOString() : null,
            ip_cadastro: ip,
          },
          { onConflict: "id" },
        );

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      return NextResponse.json({ empresa });
    }

    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    if (!body.jobTitle.trim()) {
      return NextResponse.json({ error: "Titulo da vaga e obrigatorio" }, { status: 400 });
    }

    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .insert({
        empresa_id: usuario.empresa_id,
        criado_por: user.id,
        titulo: body.jobTitle.trim(),
        area: body.area || "Geral",
        tipo_contrato: body.contract || "CLT",
        localizacao: body.location || "",
        briefing: body.briefing || "",
        status: "ativa",
      })
      .select("id,titulo,area,tipo_contrato,localizacao,briefing,status,created_at")
      .single();

    if (vagaError || !vaga) {
      return NextResponse.json({ error: vagaError?.message || "Falha ao criar vaga" }, { status: 500 });
    }

    return NextResponse.json({ vaga });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
