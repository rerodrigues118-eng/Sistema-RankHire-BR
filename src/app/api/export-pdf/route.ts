import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

import { getPdfLimitFromPlan } from '@/lib/planos';

export async function POST(req: Request) {
  try {
    const { userId, supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const body = (await req.json()) as { candidateId: string };
    if (!body.candidateId) {
      return NextResponse.json({ error: "candidateId obrigatório" }, { status: 400 });
    }

    // Get user info including role
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Get company plan
    const { data: empresa } = await admin
      .from("empresas")
      .select("plano, limite_pdfs_mes, admin_email")
      .eq("id", usuario.empresa_id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const userRole = usuario.role || "member";
    const isAdmin = userRole === "superadmin" || userRole === "admin";

    // Superadmins and admins get unlimited exports
    if (!isAdmin) {
      const planLimit = getPdfLimitFromPlan(empresa.plano, empresa) ?? empresa.limite_pdfs_mes ?? 10;

      if (planLimit !== null) {
        // Count processed PDFs this month as the canonical usage metric
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

        const { count: processedCount } = await admin
          .from("pdf_candidates")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", usuario.empresa_id)
          .gte("created_at", monthStart)
          .lt("created_at", nextMonthStart);

        const usedThisMonth = processedCount ?? 0;

        if (usedThisMonth >= planLimit) {
          return NextResponse.json(
            {
              error: "Limite de uso de PDF atingido",
              limit: planLimit,
              used: usedThisMonth,
              mes: currentMonth,
              upgrade_message: `Você atingiu o limite de ${planLimit} PDFs processados do plano ${empresa.plano}. Faça upgrade para processar mais.`,
            },
            { status: 403 }
          );
        }
      }
    }

    // Register the export
    const currentMonth = new Date().toISOString().slice(0, 7);
    await admin.from("pdf_exports").insert({
      empresa_id: usuario.empresa_id,
      usuario_id: userId,
      candidate_id: body.candidateId,
      mes_referencia: currentMonth,
    });

    return NextResponse.json({ success: true, message: "Exportação registrada com sucesso." });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ quota: null });
    }

    const { data: empresa } = await admin
      .from("empresas")
      .select("plano, limite_pdfs_mes")
      .eq("id", usuario.empresa_id)
      .single();

    const userRole = usuario.role || "member";
    const isAdmin = userRole === "superadmin" || userRole === "admin";

    if (isAdmin) {
      return NextResponse.json({
        quota: {
          isAdmin: true,
          used: 0,
          limit: null,
          remaining: null,
          plano: empresa?.plano || "superadmin",
          mes: new Date().toISOString().slice(0, 7),
        },
      });
    }

    const planLimit = getPdfLimitFromPlan(empresa?.plano || "trial_starter", empresa ?? undefined);
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Use processed PDFs as the canonical used count
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
    const { count: processedCount } = await admin
      .from("pdf_candidates")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", usuario.empresa_id)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonthStart);

    const used = processedCount ?? 0;

    return NextResponse.json({
      quota: {
        isAdmin: false,
        used,
        limit: planLimit,
        remaining: planLimit === null ? null : Math.max(0, planLimit - used),
        plano: empresa?.plano || "trial_starter",
        mes: currentMonth,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
