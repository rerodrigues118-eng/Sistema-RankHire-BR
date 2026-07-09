import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import { getRedisConnection } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, telefone } = body;

    if (!email || !telefone) {
      return NextResponse.json({ error: 'E-mail e telefone são obrigatórios' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // 1. Verificar duplicidade de e-mail e telefone
    const { data: existingUser, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .select('email, telefone')
      .or(`email.eq.${emailTrimmed},telefone.eq.${telefone}`)
      .limit(1);

    if (dbError) {
      console.error('[auth/email/send] Erro ao consultar banco:', dbError);
      return NextResponse.json({ error: 'Erro ao validar dados' }, { status: 500 });
    }

    if (existingUser && existingUser.length > 0) {
      const isEmail = existingUser[0].email === emailTrimmed;
      return NextResponse.json(
        { 
          error: isEmail ? 'Este e-mail já está cadastrado.' : 'Este número de telefone já está vinculado a uma conta.' 
        },
        { status: 409 }
      );
    }

    // 2. Gerar código OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Salvar no Redis (validade de 10 minutos)
    const redis = getRedisConnection();
    if (redis) {
      await redis.set(`otp:${emailTrimmed}`, otp, 'EX', 600); // 600 segundos = 10 minutos
    } else {
      console.warn('Redis indisponível, simulando OTP...');
      // Apenas fallback, idealmente o Redis tem que funcionar
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
