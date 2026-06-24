import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    const { data: batch, error: batchError } = await supabase
      .from("pdf_batches")
      .select("id, status, total_files, processed_files")
      .eq("id", id)
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    const { data: candidates, error: candError } = await supabase
      .from("pdf_candidates")
      .select("id, file_url, score_final, score, nome_candidato, status")
      .eq("batch_id", id);

    if (candError) {
      return NextResponse.json({ error: candError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...batch,
      candidates: candidates || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
