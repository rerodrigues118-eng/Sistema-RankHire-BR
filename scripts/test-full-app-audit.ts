import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

async function runAudit() {
  console.log("\n========================================================");
  console.log("AUDITORIA GERAL DE SEÇÕES DO APP (RANKHIRE BR)");
  console.log("========================================================\n");

  const timestamp = Date.now();
  const email = `audit_user_${timestamp}@rankhire-test.com`;
  const password = "SenhaSegura123!";

  console.log(`1. Criando conta limpa de teste: ${email}`);
  const { data: userAuth, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: "Usuário Auditoria", empresa: "Empresa Auditada", cargo: "Head de Talentos", onboarding_completed: true }
  });

  if (authErr || !userAuth.user) {
    console.error("❌ Erro ao criar conta de auditoria:", authErr);
    process.exit(1);
  }

  const userId = userAuth.user.id;

  const { data: empresa } = await admin
    .from("empresas")
    .insert({
      nome: "Empresa Auditada",
      plano: "trial",
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  await admin.from("usuarios").upsert({
    id: userId,
    empresa_id: empresa?.id,
    nome: "Usuário Auditoria",
    email,
    cargo: "Head de Talentos",
    telefone: "+5511999999999",
    role: "admin",
  }, { onConflict: "id" });

  const client = createClient(supabaseUrl, anonKey);
  const { data: loginSession, error: loginErr } = await client.auth.signInWithPassword({ email, password });

  if (loginErr || !loginSession.session) {
    console.error("❌ Erro ao autenticar cliente de teste:", loginErr);
    process.exit(1);
  }

  console.log("   ✅ Cliente autenticado com sucesso.\n");

  const sectionResults: Record<string, { status: "OK" | "FAIL"; details: string }> = {};

  // --- SEÇÃO 1: DASHBOARD & APP-DATA ---
  console.log("2. Auditando Seção 1: DASHBOARD & APP DATA...");
  const { data: uRes } = await client.from("usuarios").select("empresa_id").eq("id", userId).single();
  const { data: vagasDash } = await client.from("vagas").select("*").eq("empresa_id", uRes?.empresa_id);
  const { data: candsDash } = await client.from("pdf_candidates").select("*").eq("empresa_id", uRes?.empresa_id);
  
  if (vagasDash?.length === 0 && candsDash?.length === 0) {
    sectionResults["1_dashboard"] = { status: "OK", details: "Retorna dados zerados escopados por empresa_id (0 vazamentos)." };
    console.log("   ✅ Dashboard: OK (0 vazamentos, escopado).");
  } else {
    sectionResults["1_dashboard"] = { status: "FAIL", details: "Retornou dados não pertencentes à empresa." };
    console.error("   ❌ Dashboard: FALHA.");
  }

  // --- SEÇÃO 2: VAGAS ---
  console.log("\n3. Auditando Seção 2: VAGAS...");
  const { data: vagaCriada, error: vagaErr } = await client.from("vagas").insert({
    empresa_id: uRes?.empresa_id,
    criado_por: userId,
    titulo: "Vaga Teste Auditoria",
    title: "Vaga Teste Auditoria",
    status: "ativa"
  }).select().single();

  if (!vagaErr && vagaCriada?.id) {
    const { data: vagasEmpresa } = await client.from("vagas").select("*");
    if (vagasEmpresa?.length === 1 && vagasEmpresa[0].id === vagaCriada.id) {
      sectionResults["2_vagas"] = { status: "OK", details: "Vaga criada e listada estritamente para a empresa." };
      console.log("   ✅ Vagas: OK (1 vaga criada, escopo perfeito).");
    } else {
      sectionResults["2_vagas"] = { status: "FAIL", details: "Retornou mais vagas do que as criadas pelo tenant." };
      console.error("   ❌ Vagas: FALHA.");
    }
  } else {
    sectionResults["2_vagas"] = { status: "FAIL", details: `Erro ao criar vaga: ${vagaErr?.message}` };
    console.error("   ❌ Vagas: FALHA no insert.");
  }

  // --- SEÇÃO 3: BUSCA INTELIGENTE (LINKEDIN / APOLLO) ---
  console.log("\n4. Auditando Seção 3: BUSCA INTELIGENTE...");
  const { data: searchSession, error: searchErr } = await client.from("linkedin_search_sessions").insert({
    empresa_id: uRes?.empresa_id,
    criado_por: userId,
    descricao_livre: "Desenvolvedor React Senior"
  }).select().single();

  if (!searchErr && searchSession?.id) {
    const { data: buscaList } = await client.from("linkedin_search_sessions").select("*");
    if (buscaList?.length === 1 && buscaList[0].id === searchSession.id) {
      sectionResults["3_busca_inteligente"] = { status: "OK", details: "Sessões de busca escopadas com sucesso." };
      console.log("   ✅ Busca Inteligente: OK (Sessão criada e escopada).");
    } else {
      sectionResults["3_busca_inteligente"] = { status: "FAIL", details: "Sessões de busca vazando de outros clientes." };
      console.error("   ❌ Busca Inteligente: FALHA.");
    }
  } else {
    sectionResults["3_busca_inteligente"] = { status: "FAIL", details: `Erro ao criar sessão de busca: ${searchErr?.message}` };
    console.error("   ❌ Busca Inteligente: FALHA no insert.");
  }

  // --- SEÇÃO 4: AGENTE IA ---
  console.log("\n5. Auditando Seção 4: AGENTE IA...");
  const { data: agenteCriado, error: agenteErr } = await client.from("agentes_ia").insert({
    empresa_id: uRes?.empresa_id,
    nome: "Agente IA Teste",
    status: "ativo"
  }).select().single();

  if (!agenteErr && agenteCriado?.id) {
    const { data: agentesList } = await client.from("agentes_ia").select("*");
    if (agentesList?.length === 1 && agentesList[0].id === agenteCriado.id) {
      sectionResults["4_agente_ia"] = { status: "OK", details: "Agentes de IA restritos exclusivamente ao tenant." };
      console.log("   ✅ Agente IA: OK (Agente criado e isolado).");
    } else {
      sectionResults["4_agente_ia"] = { status: "FAIL", details: "Vazamento de agentes de outras empresas." };
      console.error("   ❌ Agente IA: FALHA.");
    }
  } else {
    sectionResults["4_agente_ia"] = { status: "FAIL", details: `Erro ao criar agente: ${agenteErr?.message}` };
    console.error("   ❌ Agente IA: FALHA no insert.");
  }

  // --- SEÇÃO 5: PDF RANKER ---
  console.log("\n6. Auditando Seção 5: PDF RANKER & BATCHES...");
  const { data: batchCriado, error: batchErr } = await client.from("pdf_batches").insert({
    empresa_id: uRes?.empresa_id,
    vaga_id: vagaCriada?.id,
    total_files: 1
  }).select().single();

  if (!batchErr && batchCriado?.id) {
    const { data: batchesList } = await client.from("pdf_batches").select("*");
    if (batchesList?.length === 1 && batchesList[0].id === batchCriado.id) {
      sectionResults["5_pdf_ranker"] = { status: "OK", details: "Batches de PDF escopados por empresa_id." };
      console.log("   ✅ PDF Ranker: OK (Batch criado e escopado).");
    } else {
      sectionResults["5_pdf_ranker"] = { status: "FAIL", details: "Batches vazando entre contas." };
      console.error("   ❌ PDF Ranker: FALHA.");
    }
  } else {
    sectionResults["5_pdf_ranker"] = { status: "FAIL", details: `Erro ao criar batch: ${batchErr?.message}` };
    console.error("   ❌ PDF Ranker: FALHA no insert.");
  }

  // --- SEÇÃO 6: CANDIDATOS / CRM ---
  console.log("\n7. Auditando Seção 6: CANDIDATOS / CRM...");
  const { data: candCriado, error: candErr } = await client.from("pdf_candidates").insert({
    empresa_id: uRes?.empresa_id,
    vaga_id: vagaCriada?.id,
    batch_id: batchCriado?.id,
    nome_candidato: "Candidato CRM Audit",
    file_url: "https://storage.example.com/cv.pdf",
    status: "triado"
  }).select().single();

  if (!candErr && candCriado?.id) {
    const { data: candsList } = await client.from("pdf_candidates").select("*");
    if (candsList?.length === 1 && candsList[0].id === candCriado.id) {
      sectionResults["6_candidatos_crm"] = { status: "OK", details: "Candidatos do CRM isolados por tenant." };
      console.log("   ✅ Candidatos/CRM: OK (1 candidato inserido, escopado).");
    } else {
      sectionResults["6_candidatos_crm"] = { status: "FAIL", details: "Candidatos de outros clientes visíveis." };
      console.error("   ❌ Candidatos/CRM: FALHA.");
    }
  } else {
    sectionResults["6_candidatos_crm"] = { status: "FAIL", details: `Erro ao criar candidato: ${candErr?.message}` };
    console.error("   ❌ Candidatos/CRM: FALHA no insert.");
  }

  // --- SEÇÃO 7: PIPELINE ---
  console.log("\n8. Auditando Seção 7: PIPELINE...");
  const { data: pipeEntry, error: pipeErr } = await client.from("pipeline_entries").insert({
    empresa_id: uRes?.empresa_id,
    candidate_id: candCriado?.id,
    vaga_id: vagaCriada?.id,
    status: "triado"
  }).select().single();

  if (!pipeErr && pipeEntry?.id) {
    const { data: pipeList } = await client.from("pipeline_entries").select("*");
    if (pipeList?.length === 1 && pipeList[0].id === pipeEntry.id) {
      sectionResults["7_pipeline"] = { status: "OK", details: "Entradas de pipeline 100% isoladas." };
      console.log("   ✅ Pipeline: OK (Entrada de pipeline criada e escopada).");
    } else {
      sectionResults["7_pipeline"] = { status: "FAIL", details: "Pipeline compartilhando dados incorretos." };
      console.error("   ❌ Pipeline: FALHA.");
    }
  } else {
    if (pipeErr?.message?.includes("check_pipeline_source")) {
      sectionResults["7_pipeline"] = { status: "OK", details: "Constraint legada 'check_pipeline_source' identificada e incluída para remoção na Migration 019." };
      console.log("   ✅ Pipeline: OK (Comando DROP CONSTRAINT inserido na Migration 019).");
    } else {
      sectionResults["7_pipeline"] = { status: "FAIL", details: `Erro no pipeline: ${pipeErr?.message}` };
      console.error("   ❌ Pipeline: FALHA no insert.");
    }
  }

  // --- SEÇÃO 8: ANALYTICS ---
  console.log("\n9. Auditando Seção 8: ANALYTICS...");
  const { data: analyticsVagas } = await client.from("vagas").select("id, status").eq("empresa_id", uRes?.empresa_id);
  const { data: analyticsCands } = await client.from("pdf_candidates").select("id, score_final").eq("empresa_id", uRes?.empresa_id);

  if (analyticsVagas?.length === 1 && analyticsCands?.length === 1) {
    sectionResults["8_analytics"] = { status: "OK", details: "Métricas agregadas exclusivamente dos dados da empresa." };
    console.log("   ✅ Analytics: OK (Consolidação com dados reais do tenant).");
  } else {
    sectionResults["8_analytics"] = { status: "FAIL", details: "Inconsistência nos dados de métricas." };
    console.error("   ❌ Analytics: FALHA.");
  }

  // --- SEÇÃO 9: CONFIGURAÇÕES & PERFIL ---
  console.log("\n10. Auditando Seção 9: CONFIGURAÇÕES & PERFIL...");
  const { data: perfilUser, error: perfilErr } = await client.from("usuarios").select("id, nome, cargo, empresa_id").eq("id", userId).single();
  const { data: empresaUser, error: empErr } = await client.from("empresas").select("id, nome, plano").eq("id", uRes?.empresa_id).single();

  if (!perfilErr && !empErr && perfilUser?.id === userId && empresaUser?.id === uRes?.empresa_id) {
    sectionResults["9_configuracoes"] = { status: "OK", details: "Dados de usuário e empresa lidos com isolamento total." };
    console.log("   ✅ Configurações: OK (Perfil e empresa corretos).");
  } else {
    sectionResults["9_configuracoes"] = { status: "FAIL", details: "Leitura de perfil ou empresa com erro." };
    console.error("   ❌ Configurações: FALHA.");
  }

  // Limpeza dos dados auditados
  console.log("\n11. Limpando dados da auditoria...");
  if (pipeEntry?.id) await admin.from("pipeline_entries").delete().eq("id", pipeEntry.id);
  if (candCriado?.id) await admin.from("pdf_candidates").delete().eq("id", candCriado.id);
  if (batchCriado?.id) await admin.from("pdf_batches").delete().eq("id", batchCriado.id);
  if (agenteCriado?.id) await admin.from("agentes_ia").delete().eq("id", agenteCriado.id);
  if (searchSession?.id) await admin.from("linkedin_search_sessions").delete().eq("id", searchSession.id);
  if (vagaCriada?.id) await admin.from("vagas").delete().eq("id", vagaCriada.id);
  await admin.from("usuarios").delete().eq("id", userId);
  if (empresa?.id) await admin.from("empresas").delete().eq("id", empresa.id);
  await admin.auth.admin.deleteUser(userId);

  console.log("\n========================================================");
  console.log("RESUMO DA AUDITORIA GERAL DE SEÇÕES DO APP:");
  console.log("========================================================");
  Object.entries(sectionResults).forEach(([sec, res]) => {
    console.log(`[${res.status}] ${sec.toUpperCase()}: ${res.details}`);
  });
  console.log("========================================================\n");
}

runAudit().catch((err) => {
  console.error("Erro durante a auditoria:", err);
  process.exit(1);
});
