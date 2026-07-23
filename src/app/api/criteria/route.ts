import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { z } from "zod";

const CriterioSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(100),
  peso: z.number().min(1).max(5),
  descricao: z.string().optional().default(""),
  gerado_por_ia: z.boolean().optional().default(false),
});

const SaveSchema = z.object({
  vaga_id: z.string().uuid("vaga_id inválido"),
  criterios: z.array(CriterioSchema).min(1, "Mínimo 1 critério").max(5),
});

type RawCrit = {
  id: string;
  nome?: string | null;
  peso?: number | null;
  description?: string | null;
  weight?: number | null;
};

function normalizeCriteria(rawCriteria: RawCrit[]) {
  return rawCriteria.map((c) => ({
    id: c.id,
    nome: c.nome || c.description || "",
    peso: c.peso ?? c.weight ?? 3,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const vagaId = searchParams.get("vaga_id");

    if (!vagaId) {
      return NextResponse.json({ error: "vaga_id obrigatório" }, { status: 400 });
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ criteria: [] }, { status: 200 });
    }

    const { data: vaga, error: vagaError } = await supabase
      .from("vagas")
      .select("id")
      .eq("id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .maybeSingle();

    if (vagaError) {
      return NextResponse.json({ error: vagaError.message }, { status: 500 });
    }

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    const { data: criteria, error } = await supabase
      .from("criteria")
      .select("id, nome, peso, description, weight")
      .eq("vaga_id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ criteria: normalizeCriteria((criteria || []) as RawCrit[]) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireAuth();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = SaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          detalhes: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { vaga_id, criterios } = parsed.data;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 400 });
    }

    const { data: vaga, error: vagaError } = await supabase
      .from("vagas")
      .select("id, titulo, title")
      .eq("id", vaga_id)
      .eq("empresa_id", usuario.empresa_id)
      .maybeSingle();

    if (vagaError) {
      return NextResponse.json({ error: vagaError.message }, { status: 500 });
    }

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada ou sem permissão" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("criteria")
      .delete()
      .eq("vaga_id", vaga_id)
      .eq("empresa_id", usuario.empresa_id);

    if (deleteError) {
      return NextResponse.json({ error: `Erro ao limpar critérios antigos: ${deleteError.message}` }, { status: 500 });
    }

    const rows = criterios.map((c) => ({
      vaga_id,
      empresa_id: usuario.empresa_id,
      nome: c.nome.trim(),
      peso: c.peso,
      descricao: c.descricao?.trim() || null,
      gerado_por_ia: c.gerado_por_ia,
    }));

    const { data: saved, error: insertError } = await supabase
      .from("criteria")
      .insert(rows)
      .select("id, nome, peso, description, weight");

    if (insertError) {
      return NextResponse.json({ error: `Erro ao salvar critérios: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      criteria: normalizeCriteria((saved || []) as RawCrit[]),
      vaga: vaga.titulo || vaga.title || "Vaga",
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 });
  }
}
