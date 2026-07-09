import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testInsert() {
  if (!url || !serviceKey) {
    console.error("Environment variables missing!");
    process.exit(1);
  }
  const adminClient = createClient(url, serviceKey);

  console.log("Testing insert into 'vagas' from scripts...");
  try {
    const { data, error } = await adminClient
      .from('vagas')
      .insert({
        empresa_id: 'bbd20797-7ee7-4cb2-8642-76884773df4d',
        criado_por: '762da0fb-c1a7-4287-8452-8d0cdccffba1',
        titulo: 'Vaga de Teste scripts',
        title: 'Vaga de Teste scripts',
        area: 'Tecnologia',
        tipo_contrato: 'CLT',
        localizacao: 'São Paulo, SP',
        briefing: 'Descrição de teste scripts',
        status: 'ativa',
      })
      .select()
      .single();
    
    console.log("Insert result:", { data, error });
  } catch (err) {
    console.error("Insert threw exception:", err);
  }
  process.exit(0);
}

testInsert();
