import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

import { z } from "zod";

const OnboardingCompanySchema = z.object({
  step: z.literal("company"),
  nome: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  cargo: z.string().optional(),
  telefone: z.string().optional(),
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório."),
  cnpj: z.string().optional(),
  tamanho: z.string().optional(),
  segmento: z.string().optional(),
  termosAceitos: z.boolean().optional(),
  termosVersao: z.string().optional(),
  consentimentoMarketing: z.boolean().optional(),
});

const OnboardingJobSchema = z.object({
  step: z.literal("job"),
  jobTitle: z.string().min(1, "Titulo da vaga e obrigatorio"),
  area: z.string().optional(),
  contract: z.string().optional(),
  location: z.string().optional(),
  briefing: z.string().optional(),
});

const OnboardingSchema = z.discriminatedUnion("step", [
  OnboardingCompanySchema,
  OnboardingJobSchema,
]);

type OnboardingBody = z.infer<typeof OnboardingSchema>;

export async function POST(req: Request) {
  const { userId, supabase: authSupabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jsonBody = await req.json();
    const parseResult = OnboardingSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.flatten().formErrors[0] || parseResult.error.issues[0]?.message || "Entrada inválida" }, { status: 400 });
    }
    const body = parseResult.data;
    // admin-client: justificado — onboarding que pode ajustar dados administrativos
    const admin = createSupabaseAdminClient();

    const { data: usuarioAtual, error: usuarioAtualError } = await admin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (usuarioAtualError) {
      return NextResponse.json({ error: usuarioAtualError.message || "Falha ao carregar usuario" }, { status: 500 });
    }

    if (body.step === "company") {
      const companyBody = body;
      const companyName = companyBody.nomeEmpresa.trim();

      const normalizedPhone = companyBody.telefone?.replace(/\D/g, "");
      const telefone = normalizedPhone ? `+${normalizedPhone}` : null;
      const userName = companyBody.nome?.trim() || user.user_metadata?.nome || null;
      const userEmail = user.email ? user.email : companyBody.email?.trim() || null;
      const userCargo = companyBody.cargo?.trim() || user.user_metadata?.cargo || null;
      const role = usuarioAtual?.role === "superadmin" ? "superadmin" : usuarioAtual?.role || "admin";

      const empresaPayload = {
        nome: companyName,
        cnpj: companyBody.cnpj?.trim() || null,
        tamanho: body.tamanho || "1-10",
        segmento: body.segmento || "Tecnologia",
        plano: "trial_starter",
        trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: "trialing",
        limite_pdfs_mes: 10,
        limite_buscas_linkedin: 0,
        limite_vagas: 1,
      };

      const empresaId = usuarioAtual?.empresa_id ?? undefined;
      const { data: empresa, error: empresaError } = empresaId
        ? await admin
            .from("empresas")
            .update(empresaPayload)
            .eq("id", empresaId)
            .select("id,nome,cnpj,tamanho,segmento,plano,trial_expires_at")
            .single()
        : await admin
            .from("empresas")
            .insert(empresaPayload)
            .select("id,nome,cnpj,tamanho,segmento,plano,trial_expires_at")
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
            email: userEmail,
            nome: userName,
            telefone,
            cargo: userCargo,
            empresa_id: empresa.id,
            role,
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

      return NextResponse.json({
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          cnpj: empresa.cnpj,
          tamanho: empresa.tamanho,
          segmento: empresa.segmento,
          plano: empresa.plano,
        },
      });
    }

    const { data: usuario, error: usuarioError } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", user.id)
      .maybeSingle();

    if (usuarioError) {
      return NextResponse.json({ error: usuarioError.message || "Falha ao carregar usuario" }, { status: 500 });
    }

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const { data: empresa, error: empresaError } = await admin
      .from("empresas")
      .select("id")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    if (empresaError) {
      return NextResponse.json({ error: empresaError.message || "Falha ao carregar empresa" }, { status: 500 });
    }

    if (!empresa) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const jobTitle = body.jobTitle.trim();

    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .insert({
        empresa_id: usuario.empresa_id,
        criado_por: user.id,
        title: jobTitle,
        area: body.area || "Geral",
        tipo_contrato: body.contract || "CLT",
        localizacao: body.location || "",
        briefing: body.briefing || "",
        status: "ativa",
      })
      .select("id,title,area,tipo_contrato,localizacao,briefing,status,created_at")
      .single();

    if (vagaError || !vaga) {
      return NextResponse.json({ error: vagaError?.message || "Falha ao criar vaga" }, { status: 500 });
    }

    return NextResponse.json({ vaga });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
