import { handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { createSupabaseAdminClient } from '@/lib/admin';
import { NextResponse } from 'next/server';
import { pendingChanges } from '@/lib/profile-change-store';

type Body = { type?: 'email' | 'phone'; code?: string; newValue?: string };

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as Body;
    if (!body?.type || !body.code) return NextResponse.json({ error: 'type and code required' }, { status: 400 });

    const key = `${userId}:${body.type}`;
    const entry = pendingChanges.get(key);
    if (!entry) return NextResponse.json({ error: 'Nenhuma solicitacao encontrada' }, { status: 404 });
    if (Date.now() > entry.expiresAt) {
      pendingChanges.delete(key);
      return NextResponse.json({ error: 'Codigo expirado' }, { status: 400 });
    }
    if (entry.code !== body.code) return NextResponse.json({ error: 'Codigo invalido' }, { status: 400 });

    // apply change
    // admin-client: justificado — verificação de mudança sensível exige service-role
    const admin = createSupabaseAdminClient();
    const update: Record<string, unknown> = {};
    if (body.type === 'email') update.email = entry.newValue;
    if (body.type === 'phone') update.telefone = entry.newValue;

    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 });

    const { data, error } = await admin.from('usuarios').update(update).eq('id', userId).select('id,empresa_id,nome,email,cargo,telefone,avatar_url,role').single();
    pendingChanges.delete(key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Note: not updating auth user email/phone here; that requires admin auth update.
    return NextResponse.json({ message: 'Alteracao aplicada', profile: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
