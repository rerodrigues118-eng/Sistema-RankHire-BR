import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import crypto from "crypto";

function maskEmail(email?: string | null) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "****";
  return `${user.slice(0, 2)}*****@${domain}`;
}

function maskPhone(phone?: string | null) {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length >= 11) {
    return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 5)}****-****`;
  }
  return "+55 ** *****-****";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return NextResponse.json({ error: "Hash é obrigatório." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: share, error } = await supabase
      .from("public_shares")
      .select("candidates, criterios, created_at")
      .eq("share_hash", hash)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!share) {
      return NextResponse.json({ error: "Link de compartilhamento não encontrado ou expirado." }, { status: 404 });
    }

    // Mascarar dados confidenciais dos candidatos no lado do servidor
    const rawCandidates = (share.candidates as any[]) || [];
    const maskedCandidates = rawCandidates.map((c) => ({
      ...c,
      email: maskEmail(c.email),
      telefone: maskPhone(c.telefone),
      phone: maskPhone(c.phone || c.telefone),
    }));

    return NextResponse.json({
      criterios: share.criterios,
      candidates: maskedCandidates,
      created_at: share.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    const empresaId = usuario?.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não associada ao usuário." }, { status: 403 });
    }

    const { vagaId, criterios, candidates } = (await req.json()) as {
      vagaId: string;
      criterios: any;
      candidates: any[];
    };

    if (!vagaId || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: "Vaga e candidatos são obrigatórios." }, { status: 400 });
    }

    // Limitar rigidamente aos top 30 candidatos por score
    const sortedCandidates = [...candidates]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 30);

    // Gerar um hash seguro de 10 caracteres hexadecimais (ex: sh_f39a4b81c2)
    const randomHash = `sh_${crypto.randomBytes(5).toString("hex")}`;

    const { error } = await supabase.from("public_shares").insert({
      empresa_id: empresaId,
      vaga_id: vagaId,
      share_hash: randomHash,
      criterios,
      candidates: sortedCandidates,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const host = req.headers.get("host") || "sistema-rank-hire-br.vercel.app";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const appUrl = host.includes("localhost") 
      ? `http://${host}` 
      : `${protocol}://${host}`;
    const shareLink = `${appUrl}/search/public/${randomHash}`;

    return NextResponse.json({ shareLink });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
