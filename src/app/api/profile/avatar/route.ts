import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { createSupabaseAdminClient } from '@/lib/admin';

type Body = { filename?: string; contentType?: string; data?: string };

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as Body;
    if (!body?.filename || !body?.data) return NextResponse.json({ error: 'filename and data required' }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const extension = body.filename.split('.').pop() || 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${extension}`;

    const buffer = Buffer.from(body.data, 'base64');

    const { error: uploadError } = await admin.storage.from('avatars').upload(path, buffer, {
      contentType: body.contentType || 'image/jpeg',
      upsert: true,
    } as any);

    if (uploadError) {
      console.error('server upload error', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Erro ao enviar arquivo.' }, { status: 500 });
    }

    const publicRes = admin.storage.from('avatars').getPublicUrl(path);
    const publicUrl = publicRes?.data?.publicUrl;

    if (!publicUrl) {
      console.error('no public url', publicRes);
      return NextResponse.json({ error: 'Nao foi possivel obter a URL publica.' }, { status: 500 });
    }

    return NextResponse.json({ publicUrl });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
