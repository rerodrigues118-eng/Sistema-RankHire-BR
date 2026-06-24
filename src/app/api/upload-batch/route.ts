import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { pdfQueue } from "@/lib/queue";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, supabase } = await requireAuth();
    const { storagePaths, vaga_id } = (await req.json()) as {
      storagePaths?: string[];
      vaga_id?: string;
    };

    if (!storagePaths?.length) {
      return NextResponse.json({ error: "Lista de caminhos do storage invalida" }, { status: 400 });
    }

    if (!vaga_id) {
      return NextResponse.json({ error: "vaga_id obrigatorio" }, { status: 400 });
    }

    const { data: vaga, error: vagaError } = await supabase
      .from("vagas")
      .select("id, empresa_id")
      .eq("id", vaga_id)
      .single();

    if (vagaError || !vaga?.empresa_id) {
      return NextResponse.json({ error: "Vaga nao encontrada para este usuario" }, { status: 404 });
    }

    const batchId = crypto.randomUUID();
    const { error: batchError } = await supabase.from("pdf_batches").insert({
      id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      total_files: storagePaths.length,
      status: "processing",
    });

    if (batchError) {
      return NextResponse.json({ error: "Falha na criacao do lote" }, { status: 500 });
    }

    const candidatesData = storagePaths.map((path) => ({
      id: crypto.randomUUID(),
      batch_id: batchId,
      vaga_id,
      empresa_id: vaga.empresa_id,
      file_url: path,
    }));

    const { error: candError } = await supabase.from("pdf_candidates").insert(candidatesData);

    if (candError) {
      return NextResponse.json({ error: "Erro na insercao de dados" }, { status: 500 });
    }

    const jobsToQueue = candidatesData.map((cand) => ({
      name: "extract-and-score-pdf",
      data: {
        candidateId: cand.id,
        storagePath: cand.file_url,
        vagaId: vaga_id,
        batchId,
        userId,
      },
    }));

    await pdfQueue.addBulk(jobsToQueue);

    return NextResponse.json({
      queued: jobsToQueue.length,
      batch_id: batchId,
      candidates: candidatesData.map(c => ({ id: c.id, file_url: c.file_url })),
      message: "Processamento iniciado no background com sucesso",
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
