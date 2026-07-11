import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const EmpresaPatchSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  cnpj: z.string().trim().min(1).nullable().optional(),
  tamanho: z.string().trim().min(1).optional(),
  segmento: z.string().trim().min(1).optional(),
});

type UsuarioRow = { empresa_id: string | null };

type EmpresaRow = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  tamanho: string | null;
  segmento: string | null;
  plano: string | null;
};

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    
    // admin-client: justificado — leitura administrativa de empresas
    // Converted to use authenticated `supabase` for user-scoped read
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .maybeSingle();

    if (usuarioError) {
      console.error("[GET /api/empresas] usuarioError:", usuarioError);
      return NextResponse.json({ error: usuarioError.message }, { status: 500 });
    }

    if (!usuario?.empresa_id) {
      return NextResponse.json({ empresa: null });
    }

    const { data: empresa, error } = await supabase
      .from("empresas")
      .select("id,nome,cnpj,tamanho,segmento,plano")
      .eq("id", usuario.empresa_id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/empresas] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ empresa: empresa || null });
  } catch (error: unknown) {
    console.error("[GET /api/empresas] catch error:", error);
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireAuth();
    const raw = await req.json();
    const parsedResult = EmpresaPatchSchema.safeParse(raw);

    if (!parsedResult.success) {
      return NextResponse.json({ error: "Payload invalido", details: parsedResult.error.format() }, { status: 400 });
    }

    const parsed = parsedResult.data;
    // admin-client: justificado — escrita administrativa de empresas
    const admin = createSupabaseAdminClient();

    const { data: usuario, error: usuarioError } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .maybeSingle();

    if (usuarioError) {
      return NextResponse.json({ error: usuarioError.message }, { status: 500 });
    }

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (typeof parsed.nome === "string") updatePayload.nome = parsed.nome;
    // cnpj pode ser string ou null (limpar o campo)
    if (Object.prototype.hasOwnProperty.call(parsed, "cnpj")) {
      updatePayload.cnpj = parsed.cnpj ?? null;
    }
    if (typeof parsed.tamanho === "string") updatePayload.tamanho = parsed.tamanho;
    if (typeof parsed.segmento === "string") updatePayload.segmento = parsed.segmento;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteracao enviada." }, { status: 400 });
    }

    const { data: empresa, error } = await admin
      .from("empresas")
      .update(updatePayload)
      .eq("id", usuario.empresa_id)
      .select("id,nome,cnpj,tamanho,segmento,plano")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ empresa: empresa || null });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
