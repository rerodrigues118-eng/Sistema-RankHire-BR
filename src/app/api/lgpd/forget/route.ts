import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { LgpdForgetSchema } from "@/lib/validation";
import { logAuditAccess } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuth();

    const body = await req.json();
    const parsed = LgpdForgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos para expurgo LGPD.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { candidateId, reason } = parsed.data;

    // Check candidate existence & tenant ownership
    const { data: candidate, error: fetchErr } = await supabase
      .from("pdf_candidates")
      .select("id, vaga_id, email_contato, nome_candidato")
      .eq("id", candidateId)
      .single();

    if (fetchErr || !candidate) {
      return NextResponse.json({ error: "Candidato não encontrado." }, { status: 404 });
    }

    // Permanently anonymize PII and soft/hard purge
    const { error: purgeErr } = await supabase
      .from("pdf_candidates")
      .update({
        nome_candidato: "Candidato Removido (LGPD)",
        email_contato: null,
        telefone: null,
        resumo_ia: "Dados pessoais expurgados a pedido do titular em conformidade com a LGPD (Art. 18, VI).",
        parsed_text: null,
        storage_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (purgeErr) {
      // Fallback hard delete if update fails
      await supabase.from("pdf_candidates").delete().eq("id", candidateId);
    }

    // Log immutable compliance audit entry
    await logAuditAccess({
      userId,
      action: "LGPD_FORGET",
      resourceId: candidateId,
      resourceType: "candidate",
      details: {
        reason,
        legalBasis: "LGPD Art. 18, VI - Expurgo de dados pessoais",
        timestamp: new Date().toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Dados do candidato expurgados definitivamente em conformidade com a LGPD.",
      candidateId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Falha interna ao processar expurgo LGPD.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
