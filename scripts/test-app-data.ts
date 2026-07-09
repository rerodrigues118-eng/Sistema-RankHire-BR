import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testAppData() {
  if (!url || !serviceKey) {
    console.error("Environment variables missing!");
    process.exit(1);
  }
  const admin = createClient(url, serviceKey);
  const empresaId = 'bbd20797-7ee7-4cb2-8642-76884773df4d'; // From the user data

  console.log("--- Testing individual queries in app-data ---");

  console.time("1. Query vagas");
  const { data: vagas, error: errVagas } = await admin
    .from("vagas")
    .select("id,titulo,area,status,created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  console.timeEnd("1. Query vagas");
  console.log("Vagas length:", vagas?.length, "Error:", errVagas);

  console.time("2. Query pdf_candidates");
  const { data: candidates, error: errCandidates } = await admin
    .from("pdf_candidates")
    .select(`
      id,
      vaga_id,
      nome_candidato,
      cargo_atual,
      empresa_atual,
      cidade,
      email_contato,
      telefone,
      score_final,
      linkedin_url,
      status,
      parsed_text,
      observacoes,
      shortlist,
      pretensao_salarial,
      disponibilidade,
      regime_preferido,
      resumo_ia,
      created_at,
      candidate_etiquetas(
        etiquetas(id,nome,cor,posicao)
      ),
      candidate_evaluations!candidate_id(
        nota,
        nota_manual,
        justificativa,
        criteria(nome, peso)
      )
    `)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  console.timeEnd("2. Query pdf_candidates");
  console.log("Candidates length:", candidates?.length, "Error:", errCandidates);

  console.time("3. Query empresas");
  const { data: empresa, error: errEmpresa } = await admin
    .from("empresas")
    .select("id,nome,plano,status,trial_expires_at,subscription_status,current_period_end,limite_pdfs_mes")
    .eq("id", empresaId)
    .single();
  console.timeEnd("3. Query empresas");
  console.log("Empresa:", empresa, "Error:", errEmpresa);

  process.exit(0);
}

testAppData();
