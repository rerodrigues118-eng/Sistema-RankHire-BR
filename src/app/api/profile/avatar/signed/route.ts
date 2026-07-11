import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { createSupabaseAdminClient } from '@/lib/admin';
import { logger } from '@/lib/logger';

type Body = { filename?: string; contentType?: string; size?: number };

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as Body;

    if (!body?.filename || !body?.contentType || typeof body.size !== 'number') {
      return NextResponse.json({ error: 'filename, contentType and size required' }, { status: 400 });
    }

    if (!ACCEPTED.has(body.contentType)) {
      return NextResponse.json({ error: 'Tipo de arquivo nao permitido' }, { status: 400 });
    }

    if (body.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo maior que 2MB' }, { status: 400 });
    }

    // admin-client: justificado — geração de URLs assinadas requer service-role
    const admin = createSupabaseAdminClient();
    const ext = String(body.filename).split('.').pop() || 'jpg';
    // path inside bucket: use userId as filename to avoid collisions
    const path = `${userId}.${ext}`;

    // create signed upload URL
    // @ts-expect-error - supabase client typing variations
    const signedResult = await (admin.storage.from('avatars') as Record<string, unknown>).createSignedUploadUrl(path);

    if (!signedResult) {
      logger.error('createSignedUploadUrl returned empty result', { path });
      return NextResponse.json({ error: 'Resposta invalida ao criar URL assinado.' }, { status: 500 });
    }

    if (signedResult?.error) {
      logger.error('createSignedUploadUrl error', signedResult.error);
      const msg = signedResult.error?.message || JSON.stringify(signedResult.error || {});
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const signedUrl = signedResult?.data?.signedUrl || signedResult?.signedUrl || signedResult?.data?.signedURL;
    const token = signedResult?.data?.token || signedResult?.token || signedResult?.data?.Token || null;

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${encodeURIComponent(path)}`;

    return NextResponse.json({ signedUrl, token, publicUrl, path });
  } catch (err: unknown) {
    logger.error('signed route error', err);
    return handleApiError(err);
  }
}
