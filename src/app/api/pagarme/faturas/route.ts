import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient } from '@/lib/pagarme';
import { handleApiError } from '@/lib/api';

type PagarmeInvoice = {
  created_at: string;
  amount: number;
  status: string;
  charge?: {
    boleto_url?: string | null;
  };
};

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json({ error: 'Empresa ID obrigatório' }, { status: 400 });
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('pagarme_subscription_id')
      .eq('id', empresaId)
      .single();

    if (!empresa || !empresa.pagarme_subscription_id) {
      return NextResponse.json({ faturas: [] });
    }

    const client = await getPagarmeClient();

    const response = await client.subscriptions.findInvoices({
      id: empresa.pagarme_subscription_id
    });

    const faturas = (response.data as PagarmeInvoice[]).map((invoice) => ({
      data: invoice.created_at,
      descricao: 'Assinatura', // could use plan name if available in invoice
      valor: invoice.amount / 100, // em reais
      status: invoice.status, // paid | pending | canceled
      url_boleto: invoice.charge?.boleto_url || null
    }));

    return NextResponse.json({ faturas });
  } catch (error: unknown) {
    return handleApiError(error, 'Erro ao buscar faturas');
  }
}
