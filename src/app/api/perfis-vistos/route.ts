import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type PerfilVistoRow = {
  linkedin_url: string;
  visto_em: string;
};

export async function POST(req: Request) {
  try {
    const { userId, supabase } = await requireAuth();
    const { linkedin_url, nome, cargo, empresa, vaga_id } = (await req.json()) as {
      linkedin_url?: string;
      nome?: string;
      cargo?: string;
      empresa?: string;
      vaga_id?: string;
    };

    if (!linkedin_url) {
      return NextResponse.json({ error: "URL obrigatoria" }, { status: 400 });
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    await supabase.from("perfis_vistos").upsert(
      {
        empresa_id: usuario.empresa_id,
        vaga_id: vaga_id || null,
        visto_por: userId,
        linkedin_url,
        visto_em: new Date().toISOString(),
        nome: nome || null,
        cargo: cargo || null,
        empresa: empresa || null,
      },
      { onConflict: "empresa_id,linkedin_url" },
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ vistos: [] });
    }

    const { data } = await supabase
      .from("perfis_vistos")
      .select("linkedin_url,visto_em")
      .eq("empresa_id", usuario.empresa_id)
      .order("visto_em", { ascending: false });

    const urls = ((data || []) as PerfilVistoRow[]).map((row) => row.linkedin_url);
    return NextResponse.json({ vistos: urls });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
