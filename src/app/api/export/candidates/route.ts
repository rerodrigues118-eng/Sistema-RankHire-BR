import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "csv";
    const vagaId = url.searchParams.get("vaga_id");

    // Obter empresa do usuário
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Buscar candidatos com filtro opcional por vaga_id
    let query = admin
      .from("pdf_candidates")
      .select("nome_candidato, cargo_atual, empresa_atual, cidade, email_contato, telefone, score_final, status, pretensao_salarial, created_at, vaga_id")
      .eq("empresa_id", usuario.empresa_id);

    if (vagaId && vagaId !== "geral") {
      query = query.eq("vaga_id", vagaId);
    }

    const { data: candidates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = candidates || [];

    // Formatar CSV com BOM UTF-8 para suporte universal no Excel
    const headers = ["Nome", "Cargo Atual", "Empresa", "Cidade", "E-mail", "Telefone", "Score IA", "Status", "Pretensão Salarial", "Data de Cadastro"];
    const csvLines = [
      headers.join(";"),
      ...rows.map(c => [
        `"${(c.nome_candidato || "").replace(/"/g, '""')}"`,
        `"${(c.cargo_atual || "").replace(/"/g, '""')}"`,
        `"${(c.empresa_atual || "").replace(/"/g, '""')}"`,
        `"${(c.cidade || "").replace(/"/g, '""')}"`,
        `"${(c.email_contato || "").replace(/"/g, '""')}"`,
        `"${(c.telefone || "").replace(/"/g, '""')}"`,
        `"${c.score_final ? c.score_final.toFixed(1) : "0"}"`,
        `"${c.status || "triado"}"`,
        `"${(c.pretensao_salarial || "").replace(/"/g, '""')}"`,
        `"${c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : ""}"`
      ].join(";"))
    ];

    const csvContent = "\uFEFF" + csvLines.join("\n");
    const filename = `candidatos_rankhire_${new Date().toISOString().slice(0, 10)}.${format === "xlsx" ? "csv" : "csv"}`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
