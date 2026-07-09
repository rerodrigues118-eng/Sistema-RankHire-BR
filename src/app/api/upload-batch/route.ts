import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { getPdfQueue } from "@/lib/queue";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from '@/lib/admin';
import { getPdfLimitFromPlan } from '@/lib/planos';

export async function POST(req: Request) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
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

    const admin = createSupabaseAdminClient();
    const { data: vaga, error: vagaError } = await admin
      .from("vagas")
      .select("id, empresa_id")
      .eq("id", vaga_id)
      .single();

    if (vagaError || !vaga?.empresa_id) {
      return NextResponse.json({ error: "Vaga nao encontrada para este usuario" }, { status: 404 });
    }

    // Check quota before creating batch
    const { data: empresa } = await admin.from('empresas').select('id,plano,limite_pdfs_mes').eq('id', vaga.empresa_id).single();

    const planLimit = getPdfLimitFromPlan(empresa?.plano, empresa || undefined) ?? empresa?.limite_pdfs_mes ?? 10;

    if (planLimit !== null) {
      const currentMonth = new Date().toISOString().slice(0,7);
      const { count } = await admin.from('pdf_exports').select('id', { count: 'exact', head: true }).eq('empresa_id', vaga.empresa_id).eq('mes_referencia', currentMonth);
      const used = count ?? 0;
      if (used >= planLimit) {
        return NextResponse.json({ error: 'Limite de uploads/exports de PDFs atingido', limit: planLimit, used, mes: currentMonth, upgrade_message: `Você atingiu o limite de ${planLimit} PDFs neste mês. Faça upgrade para processar mais.` }, { status: 403 });
      }
    }

    const batchId = crypto.randomUUID();
    const { error: batchError } = await admin.from("pdf_batches").insert({
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

    const { error: candError } = await admin.from("pdf_candidates").insert(candidatesData);

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

    const queue = await getPdfQueue();
    await queue.addBulk(jobsToQueue);

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
