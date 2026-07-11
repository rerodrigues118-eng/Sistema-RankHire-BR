import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import Redis from 'ioredis';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, telefone } = body;

    if (!email || !telefone) {
      return NextResponse.json({ error: 'E-mail e telefone são obrigatórios' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // 1. Verificar duplicidade de e-mail e telefone (check both email and phone)
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

    // 3. Salvar no Redis (validade de 10 minutos)
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      const redis = new Redis(redisUrl);
      await redis.set(`otp:${emailTrimmed}`, otp, 'EX', 600);
      redis.disconnect();
    } else {
      console.warn('REDIS_URL indisponível, simulando OTP...');
      // Apenas fallback
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
