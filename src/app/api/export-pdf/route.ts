import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

// Limits per plan (null = unlimited)
const PLAN_LIMITS: Record<string, number | null> = {
  trial_starter: 10,
  profissional: 100,
  enterprise: 500,
  superadmin: null,
  admin: null,
};

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
      const planLimit = PLAN_LIMITS[empresa.plano] ?? empresa.limite_pdfs_mes ?? 10;

      if (planLimit !== null) {
        // Count exports this month
        const currentMonth = new Date().toISOString().slice(0, 7); // "2026-06"
        const { count } = await admin
          .from("pdf_exports")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", usuario.empresa_id)
          .eq("mes_referencia", currentMonth);

        const usedThisMonth = count ?? 0;

        if (usedThisMonth >= planLimit) {
          return NextResponse.json(
            {
              error: "Limite de exportações atingido",
              limit: planLimit,
              used: usedThisMonth,
              mes: currentMonth,
              upgrade_message: `Você atingiu o limite de ${planLimit} exportações do plano ${empresa.plano}. Faça upgrade para exportar mais.`,
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

    const planLimit = PLAN_LIMITS[empresa?.plano || "trial_starter"] ?? empresa?.limite_pdfs_mes ?? 10;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { count } = await admin
      .from("pdf_exports")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", usuario.empresa_id)
      .eq("mes_referencia", currentMonth);

    const used = count ?? 0;

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
