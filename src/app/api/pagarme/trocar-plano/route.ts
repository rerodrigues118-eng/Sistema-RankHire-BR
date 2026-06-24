import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient } from '@/lib/pagarme';
import { PlanoNome } from '@/lib/planos';
import { handleApiError } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { empresaId, novoPlanId } = await req.json();

    if (!empresaId || !novoPlanId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id,pagarme_subscription_id')
      .eq('id', empresaId)
      .single();

    if (!empresa || !empresa.pagarme_subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const client = await getPagarmeClient();

    const subscription = await client.subscriptions.update({
      id: empresa.pagarme_subscription_id,
      plan_id: novoPlanId
    });

    let planoNome: PlanoNome = 'trial';
    if (novoPlanId === process.env.PAGARME_PLAN_STARTER) planoNome = 'starter';
    else if (novoPlanId === process.env.PAGARME_PLAN_PRO) planoNome = 'pro';
    else if (novoPlanId === process.env.PAGARME_PLAN_AGENCIA) planoNome = 'agencia';

    await supabase.from('empresas')
      .update({
        pagarme_plan_id: novoPlanId,
        plano: planoNome
      })
      .eq('id', empresaId);

    return NextResponse.json({ success: true, subscription });
  } catch (error: unknown) {
    return handleApiError(error, 'Erro ao trocar plano');
  }
}
