import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: empresas, error: errEmpresas } = await supabase.from('empresas').select('id');
  if (errEmpresas) throw errEmpresas;
  const empresaIds = (empresas || []).map((item) => item.id).filter(Boolean).map((id) => `'${id}'`);

  const { count: vagasNullCount, error: vagasNullError } = await supabase.from('vagas').select('id', { count: 'exact', head: true }).is('empresa_id', null);
  const { count: pdfNullCount, error: pdfNullError } = await supabase.from('pdf_candidates').select('id', { count: 'exact', head: true }).is('empresa_id', null);

  let vagasInvalidCount = 0;
  let pdfInvalidCount = 0;
  let vagasInvalidError = null;
  let pdfInvalidError = null;

  if (empresaIds.length > 0) {
    const inList = `(${empresaIds.join(',')})`;
    const vagasInvalid = await supabase.from('vagas').select('id', { count: 'exact', head: true }).not('empresa_id', 'in', inList);
    vagasInvalidCount = vagasInvalid.count ?? 0;
    vagasInvalidError = vagasInvalid.error;

    const pdfInvalid = await supabase.from('pdf_candidates').select('id', { count: 'exact', head: true }).not('empresa_id', 'in', inList);
    pdfInvalidCount = pdfInvalid.count ?? 0;
    pdfInvalidError = pdfInvalid.error;
  }

  console.log('empresa count:', empresaIds.length);
  console.log('vagas null empresa_id:', vagasNullCount, vagasNullError ? vagasNullError.message : 'OK');
  console.log('pdf_candidates null empresa_id:', pdfNullCount, pdfNullError ? pdfNullError.message : 'OK');
  console.log('vagas invalid empresa_id:', vagasInvalidCount, vagasInvalidError ? vagasInvalidError.message : 'OK');
  console.log('pdf_candidates invalid empresa_id:', pdfInvalidCount, pdfInvalidError ? pdfInvalidError.message : 'OK');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
