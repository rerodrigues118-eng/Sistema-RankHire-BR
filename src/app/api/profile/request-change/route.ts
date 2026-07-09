import { handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { NextResponse } from 'next/server';
import { pendingChanges, makeCode } from '@/lib/profile-change-store';

type Body = { type?: 'email' | 'phone'; newValue?: string };

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as Body;
    if (!body?.type || !body.newValue) return NextResponse.json({ error: 'type and newValue required' }, { status: 400 });

    const code = makeCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    pendingChanges.set(`${userId}:${body.type}`, { code, newValue: body.newValue, expiresAt });

    // In production, send via email/SMS. For now, not logged in production.

    return NextResponse.json({ message: 'Codigo de seguranca enviado (ver logs no servidor em dev).' });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
