import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient } from '@/lib/pagarme';
import { handleApiError } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID obrigatório' }, { status: 400 });
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('pagarme_subscription_id')
      .eq('id', empresaId)
      .single();

    if (!empresa || !empresa.pagarme_subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const client = await getPagarmeClient();

    const result = await client.subscriptions.cancel({
      id: empresa.pagarme_subscription_id
    });

    await supabase.from('empresas')
      .update({
        subscription_status: 'canceled',
        cancel_at_period_end: true
      })
      .eq('id', empresaId);

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return handleApiError(error, 'Erro ao cancelar');
  }
}
