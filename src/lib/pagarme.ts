import pagarme from 'pagarme';
import { createClient } from '@/lib/supabase/server';

type EmpresaBilling = {
  id: string;
  nome?: string | null;
  admin_email?: string | null;
  cnpj?: string | null;
  pagarme_customer_id?: string | null;
};

// @ts-expect-error - pagarme package has no type declarations
type PagarmeClient = Awaited<ReturnType<typeof pagarme.client.connect>>;

let pagarmeClient: PagarmeClient | null = null;

export async function getPagarmeClient() {
  if (!pagarmeClient) {
    // @ts-expect-error - pagarme package has no type declarations
    pagarmeClient = await pagarme.client.connect({
      api_key: process.env.PAGARME_API_KEY!
    });
  }
  return pagarmeClient;
}

export async function getOrCreateCustomer(empresa: EmpresaBilling) {
  if (empresa.pagarme_customer_id) {
    return empresa.pagarme_customer_id;
  }
  
  const client = await getPagarmeClient();
  
  const customer = await client.customers.create({
    name: empresa.nome,
    email: empresa.admin_email || 'contato@' + (empresa.nome || 'empresa').replace(/\s/g, '').toLowerCase() + '.com',
    document_type: empresa.cnpj ? 'cnpj' : 'cpf',
    document: empresa.cnpj ? empresa.cnpj.replace(/\D/g, '') : '00000000000', // Mock if empty
    type: empresa.cnpj ? 'company' : 'individual',
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code: '11', // default or extract from phone
        number: '999999999'
      }
    }
  });
  
  // Salva no Supabase
  const supabase = await createClient();
  await supabase.from('empresas')
    .update({ pagarme_customer_id: customer.id })
    .eq('id', empresa.id);
    
  return customer.id;
}
