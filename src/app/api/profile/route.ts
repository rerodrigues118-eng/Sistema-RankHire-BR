import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProfilePatchSchema = z.object({
  nome: z.string().optional(),
  cargo: z.string().optional(),
  avatarUrl: z.union([z.string().url(), z.null()]).optional(),
});

export async function GET() {
  try {
    const { userId, user } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: profile, error } = await admin
      .from("usuarios")
      .select("id,empresa_id,nome,email,cargo,telefone,avatar_url,role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/profile] db error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        id: profile?.id || userId,
        empresa_id: profile?.empresa_id ?? null,
        nome: profile?.nome || user?.user_metadata?.nome || null,
        email: profile?.email || user?.email || null,
        cargo: profile?.cargo || user?.user_metadata?.cargo || null,
        telefone: profile?.telefone || user?.phone || null,
        avatar_url: profile?.avatar_url || null,
        role: profile?.role || "recruiter",
      },
      sessionExpiresAt: null,
    });
  } catch (error: unknown) {
    console.error("[GET /api/profile] catch error:", error);
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireAuth();
    const raw = await req.json();
    const parsed = ProfilePatchSchema.parse(raw);

    const update: Record<string, string | null> = {};
    if (typeof parsed.nome === "string") {
      const n = parsed.nome.trim();
      if (n !== "") update.nome = n;
    }
    if (typeof parsed.cargo === "string") {
      const c = parsed.cargo.trim();
      if (c !== "") update.cargo = c;
    }
    if (Object.prototype.hasOwnProperty.call(parsed, "avatarUrl")) {
      // treat empty string as null
      const av = parsed.avatarUrl as string | null | undefined;
      if (av === undefined) {
        // do nothing
      } else if (av === null || av === "") {
        update.avatar_url = null;
      } else {
        update.avatar_url = av;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteracao enviada." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Use upsert so the usuarios row is created if missing
    const upsertPayload: Record<string, unknown> = { id: userId, ...update };
    const { data, error } = await admin
      .from("usuarios")
      .upsert(upsertPayload, { onConflict: "id" })
      .select("id,empresa_id,nome,email,cargo,telefone,avatar_url,role")
      .single();

    if (error) {
      console.error('[profile PATCH] db update error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // try to keep auth user metadata in sync for client sessions (non-fatal)
    try {
      const adminAuth = admin as unknown as Record<string, unknown>;
      const authObj = adminAuth.auth as Record<string, unknown>;
      if (authObj?.admin && typeof (authObj.admin as Record<string, unknown>).updateUserById === 'function') {
        const meta: Record<string, unknown> = {};
        if (data?.nome) meta.nome = data.nome;
        if (data?.cargo) meta.cargo = data.cargo;
        if (data?.avatar_url) meta.avatar_url = data.avatar_url;
        if (Object.keys(meta).length > 0) {
          try {
            const adminUpdateFn = (authObj.admin as Record<string, unknown>).updateUserById as (id: string, opts: Record<string, unknown>) => Promise<unknown>;
            await adminUpdateFn(userId, { user_metadata: meta });
          } catch (e) {
            console.warn('[profile PATCH] failed to update auth metadata', e);
          }
        }
      }
    } catch (e) {
      console.warn('[profile PATCH] auth update skipped', e);
    }

    
    return NextResponse.json({ profile: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
