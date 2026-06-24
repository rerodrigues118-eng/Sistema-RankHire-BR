import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient, getOrCreateCustomer } from '@/lib/pagarme';
import { PLANOS, PlanoNome } from '@/lib/planos';
import { handleApiError } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { empresaId, planId } = await req.json();

    if (!empresaId || !planId) {
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

    // Identificar plano pelo ID
    let planoNome: PlanoNome = 'trial';
    let valor = 0;
    if (planId === process.env.PAGARME_PLAN_STARTER) { planoNome = 'starter'; valor = (PLANOS.starter.preco ?? 0) * 100; }
    else if (planId === process.env.PAGARME_PLAN_PRO) { planoNome = 'pro'; valor = (PLANOS.pro.preco ?? 0) * 100; }
    else if (planId === process.env.PAGARME_PLAN_AGENCIA) { planoNome = 'agencia'; valor = (PLANOS.agencia.preco ?? 0) * 100; }

    const customerId = await getOrCreateCustomer(empresa);
    const client = await getPagarmeClient();

    const order = await client.orders.create({
      customer_id: customerId,
      items: [{
        amount: valor,
        description: 'RankHire BR - Plano ' + planoNome,
        quantity: 1
      }],
      payments: [{
        payment_method: 'boleto',
        boleto: {
          due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          instructions: 'Não aceitar após o vencimento'
        }
      }],
      metadata: {
        empresa_id: empresaId,
        plan_id: planId
      }
    });

    const charge = order.charges[0];
    const boletoData = charge.last_transaction;

    return NextResponse.json({
      boleto_url: boletoData.url,
      boleto_barcode: boletoData.line,
      due_date: boletoData.due_at,
      order_id: order.id
    });
  } catch (error: unknown) {
    return handleApiError(error, 'Erro ao gerar boleto');
  }
}
