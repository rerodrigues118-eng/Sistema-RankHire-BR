import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nome, cargo, empresa } = body;

    if (!email || !password || !nome) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Cria o usuário já com e-mail confirmado (email_confirm: true)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailTrimmed,
      password,
      email_confirm: true,
      user_metadata: {
        nome: nome.trim(),
        cargo: cargo?.trim() || '',
        empresa: empresa?.trim() || ''
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
