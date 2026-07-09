import { NextResponse } from 'next/server';
import { getRedisConnection } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const redis = getRedisConnection();
    
    if (!redis) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const savedOtp = await redis.get(`otp:${emailTrimmed}`);

    if (!savedOtp) {
      return NextResponse.json({ error: 'Código expirado ou inválido.' }, { status: 400 });
    }

    if (savedOtp !== token) {
      return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 });
    }

    // Código válido! Apaga do Redis para não ser reusado.
    await redis.del(`otp:${emailTrimmed}`);

    return NextResponse.json({ success: true, message: 'E-mail verificado com sucesso' });

  } catch (error: unknown) {
    console.error('[auth/email/verify] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}
