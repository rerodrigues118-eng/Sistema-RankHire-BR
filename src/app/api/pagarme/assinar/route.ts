import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient, getOrCreateCustomer } from '@/lib/pagarme';
import { PlanoNome } from '@/lib/planos';
import { handleApiError } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { empresaId, planId, cardToken } = await req.json();

    if (!empresaId || !planId || !cardToken) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Busca empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id,nome,cnpj,admin_email,pagarme_customer_id')
      .eq('id', empresaId)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const customerId = await getOrCreateCustomer(empresa);
    const client = await getPagarmeClient();

    const subscription = await client.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      payment_method: 'credit_card',
      card: {
        token: cardToken
      },
      metadata: {
        empresa_id: empresaId
      }
    });

    // Identificar plano pelo ID (simples)
    let planoNome: PlanoNome = 'trial';
    if (planId === process.env.PAGARME_PLAN_STARTER) planoNome = 'starter';
    else if (planId === process.env.PAGARME_PLAN_PRO) planoNome = 'pro';
    else if (planId === process.env.PAGARME_PLAN_AGENCIA) planoNome = 'agencia';

    await supabase.from('empresas')
      .update({
        pagarme_subscription_id: subscription.id,
        pagarme_plan_id: planId,
        subscription_status: 'active',
        plano: planoNome,
        current_period_end: new Date(subscription.current_period.end_at).toISOString(),
        current_period_start: new Date(subscription.current_period.start_at).toISOString(),
      })
      .eq('id', empresaId);

    return NextResponse.json({ success: true, subscription });
  } catch (error: unknown) {
    return handleApiError(error, 'Erro ao processar assinatura');
  }
}
