import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type ProfileUpdateBody = {
  nome?: string;
  cargo?: string;
  avatarUrl?: string | null;
};

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile, error } = await supabase
      .from("usuarios")
      .select("id,empresa_id,nome,email,cargo,telefone,avatar_url,role")
      .eq("id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        email: profile?.email || user?.email || null,
        telefone: profile?.telefone || user?.phone || null,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as ProfileUpdateBody;
    const update: Record<string, string | null> = {};

    if (typeof body.nome === "string") update.nome = body.nome.trim();
    if (typeof body.cargo === "string") update.cargo = body.cargo.trim();
    if (typeof body.avatarUrl === "string" || body.avatarUrl === null) update.avatar_url = body.avatarUrl;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteracao enviada." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    console.log('[profile PATCH] userId=', userId, 'update=', update);

    const { data, error } = await admin
      .from("usuarios")
      .update(update)
      .eq("id", userId)
      .select("id,empresa_id,nome,email,cargo,telefone,avatar_url,role")
      .single();

    if (error) {
      console.error('[profile PATCH] db update error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // try to keep auth user metadata in sync for client sessions (non-fatal)
    try {
      if (admin && typeof (admin as any).auth?.admin?.updateUserById === 'function') {
        const meta: Record<string, unknown> = {};
        if (data?.nome) meta.nome = data.nome;
        if (data?.cargo) meta.cargo = data.cargo;
        if (data?.avatar_url) meta.avatar_url = data.avatar_url;
        if (Object.keys(meta).length > 0) {
          // do not await to avoid delaying response too long; await but catch errors
          try {
            const up = await (admin as any).auth.admin.updateUserById(userId, { user_metadata: meta });
            console.log('[profile PATCH] auth metadata updated', { ok: up?.error ? false : true });
          } catch (e) {
            console.warn('[profile PATCH] failed to update auth metadata', e);
          }
        }
      }
    } catch (e) {
      console.warn('[profile PATCH] auth update skipped', e);
    }

    console.log('[profile PATCH] success returning profile', data?.id);
    return NextResponse.json({ profile: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
