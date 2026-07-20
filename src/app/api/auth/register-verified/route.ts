import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export async function POST(req: Request) {
  try {
    // ── Rate limit: 5 registros por minuto por IP ─────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = await checkRateLimit(`register-verified:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas de registro. Aguarde um minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, nome, cargo, empresa } = body;

    // ── Validação de input ────────────────────────────────────────
    if (!email || !password || !nome) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    const nomeTrimmed = String(nome).trim();

    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    if (nomeTrimmed.length < 2 || nomeTrimmed.length > 100) {
      return NextResponse.json({ error: 'Nome deve ter entre 2 e 100 caracteres' }, { status: 400 });
    }

    // Cria o usuário já com e-mail confirmado (email_confirm: true)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailTrimmed,
      password,
      email_confirm: true,
      user_metadata: {
        nome: nomeTrimmed,
        cargo: typeof cargo === 'string' ? cargo.trim().slice(0, 100) : '',
        empresa: typeof empresa === 'string' ? empresa.trim().slice(0, 200) : ''
      }
    });

    if (authError) {
      console.error('[auth/register-verified] Erro ao criar usuário Auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error: unknown) {
    console.error('[auth/register-verified] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}
