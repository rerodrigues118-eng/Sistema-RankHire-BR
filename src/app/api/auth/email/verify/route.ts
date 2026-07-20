import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import Redis from 'ioredis';

// Singleton Redis client para OTP (mesmo do /send)
let otpRedis: Redis | null = null;
function getOtpRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!otpRedis) {
    otpRedis = new Redis(url, { maxRetriesPerRequest: 3, enableReadyCheck: false });
    otpRedis.on('error', (err) => console.warn('[otp-redis] connection error:', err.message));
  }
  return otpRedis;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios' }, { status: 400 });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const tokenStr = String(token).trim();

    // Validação de formato
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }
    if (!OTP_REGEX.test(tokenStr)) {
      return NextResponse.json({ error: 'Código inválido (6 dígitos)' }, { status: 400 });
    }

    // ── Brute-force protection: 5 tentativas por email a cada 5 min ──
    const rl = await checkRateLimit(`otp-verify:${emailTrimmed}`, 5, 300_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas de verificação. Aguarde 5 minutos.' },
        { status: 429 }
      );
    }

    const redis = getOtpRedis();
    if (!redis) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const savedOtp = await redis.get(`otp:${emailTrimmed}`);

    if (!savedOtp) {
      return NextResponse.json({ error: 'Código expirado ou inválido.' }, { status: 400 });
    }

    if (savedOtp !== tokenStr) {
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
