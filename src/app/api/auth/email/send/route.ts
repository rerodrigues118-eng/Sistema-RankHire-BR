import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import Redis from 'ioredis';

// Singleton Redis client para OTP — evita vazamento de conexões
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

export async function POST(req: Request) {
  try {
    // ── Rate limit: 3 envios por e-mail por 10 min ──────────────
    const body = await req.json();
    const { email, telefone } = body;

    if (!email || !telefone) {
      return NextResponse.json({ error: 'E-mail e telefone são obrigatórios' }, { status: 400 });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    const rl = await checkRateLimit(`otp-send:${emailTrimmed}`, 3, 600_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Muitas solicitações para este e-mail. Aguarde 10 minutos.' },
        { status: 429 }
      );
    }

    // 1. Verificar duplicidade de e-mail e telefone
    const { data: existingEmail } = await supabaseAdmin
      .from('usuarios')
      .select('email, telefone')
      .eq('email', emailTrimmed)
      .limit(1);

    const { data: existingPhone } = await supabaseAdmin
      .from('usuarios')
      .select('email, telefone')
      .eq('telefone', telefone)
      .limit(1);

    const existingUser = [...(existingEmail || []), ...(existingPhone || [])];

    if (existingUser && existingUser.length > 0) {
      const hasEmail = existingUser.some(u => u.email === emailTrimmed);
      return NextResponse.json(
        { 
          error: hasEmail ? 'Este e-mail já está cadastrado.' : 'Este número de telefone já está vinculado a uma conta.' 
        },
        { status: 409 }
      );
    }

    // 2. Gerar código OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Salvar no Redis (validade de 10 minutos) — usa client singleton
    const redis = getOtpRedis();
    if (redis) {
      await redis.set(`otp:${emailTrimmed}`, otp, 'EX', 600);
    } else {
      console.warn('REDIS_URL indisponível, OTP não salvo.');
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    // 4. Enviar e-mail via Brevo
    const emailSent = await sendVerificationEmail(emailTrimmed, otp);
    
    if (!emailSent) {
      return NextResponse.json({ error: 'Falha ao enviar e-mail de verificação' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Código enviado com sucesso' });

  } catch (error: unknown) {
    console.error('[auth/email/send] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}
