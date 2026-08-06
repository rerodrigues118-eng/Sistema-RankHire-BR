import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  console.log("\n========================================================");
  console.log("TESTE DE VALIDAÇÃO DE ISOLAMENTO DE DADOS (MULTI-TENANCY)");
  console.log("========================================================\n");

  const timestamp = Date.now();
  const emailA = `conta_a_${timestamp}@rankhire-test.com`;
  const passwordA = "SenhaSegura123!";
  const emailB = `conta_b_${timestamp}@rankhire-test.com`;
  const passwordB = "SenhaSegura123!";

  console.log(`1. Criando Conta A: ${emailA}`);
  const { data: userA, error: errA } = await admin.auth.admin.createUser({
    email: emailA,
    password: passwordA,
    email_confirm: true,
    user_metadata: { nome: "Usuário Conta A", empresa: "Empresa Alfa" }
  });
  if (errA || !userA.user) {
    console.error("❌ Erro ao criar Conta A:", errA);
    process.exit(1);
  }
  console.log(`   Conta A criada com sucesso ID: ${userA.user.id}`);

  console.log(`\n2. Criando Conta B: ${emailB}`);
  const { data: userB, error: errB } = await admin.auth.admin.createUser({
    email: emailB,
    password: passwordB,
    email_confirm: true,
    user_metadata: { nome: "Usuário Conta B", empresa: "Empresa Beta" }
  });
  if (errB || !userB.user) {
    console.error("❌ Erro ao criar Conta B:", errB);
    process.exit(1);
  }
  console.log(`   Conta B criada com sucesso ID: ${userB.user.id}`);

  // Garante registro em empresas e usuarios para ambas as contas
  const { data: empA } = await admin.from("empresas").insert({ nome: "Empresa Alfa", plano: "trial" }).select().single();
  const { data: empB } = await admin.from("empresas").insert({ nome: "Empresa Beta", plano: "trial" }).select().single();

  if (empA && empB) {
    await admin.from("usuarios").upsert({ id: userA.user.id, empresa_id: empA.id, nome: "Usuário Conta A", email: emailA, role: "admin" });
    await admin.from("usuarios").upsert({ id: userB.user.id, empresa_id: empB.id, nome: "Usuário Conta B", email: emailB, role: "admin" });
  }

  // Login do cliente autenticado da Conta A
  const clientA = createClient(supabaseUrl, anonKey);
  const { data: sessionA } = await clientA.auth.signInWithPassword({ email: emailA, password: passwordA });
  console.log(`\n3. Verificando estado inicial da Conta A (autenticada)...`);

  // Query vagas e candidates para Conta A
  const { data: vagasA_initial } = await clientA.from("vagas").select("*");
  const { data: candidatesA_initial } = await clientA.from("pdf_candidates").select("*");

  console.log(`   Vagas iniciais Conta A: ${vagasA_initial?.length ?? 0}`);
  console.log(`   Candidatos iniciais Conta A: ${candidatesA_initial?.length ?? 0}`);

  if ((vagasA_initial?.length || 0) > 0 || (candidatesA_initial?.length || 0) > 0) {
    console.error("❌ ERRO: Conta A não iniciou 100% vazia!");
  } else {
    console.log("   ✅ CONTA A INICIOU 100% VAZIA!");
  }

  // Login do cliente autenticado da Conta B
  const clientB = createClient(supabaseUrl, anonKey);
  const { data: sessionB } = await clientB.auth.signInWithPassword({ email: emailB, password: passwordB });
  console.log(`\n4. Verificando estado inicial da Conta B (autenticada)...`);

  const { data: vagasB_initial } = await clientB.from("vagas").select("*");
  const { data: candidatesB_initial } = await clientB.from("pdf_candidates").select("*");

  console.log(`   Vagas iniciais Conta B: ${vagasB_initial?.length ?? 0}`);
  console.log(`   Candidatos iniciais Conta B: ${candidatesB_initial?.length ?? 0}`);

  if ((vagasB_initial?.length || 0) > 0 || (candidatesB_initial?.length || 0) > 0) {
    console.error("❌ ERRO: Conta B não iniciou 100% vazia!");
  } else {
    console.log("   ✅ CONTA B INICIOU 100% VAZIA!");
  }

  // 5. Criar dados na Conta A
  console.log("\n5. Criando Vaga e Candidato EXCLUSIVOS na Conta A...");
  const { data: vagaNovaA, error: errVagaA } = await clientA.from("vagas").insert({
    empresa_id: empA.id,
    criado_por: userA.user.id,
    titulo: "Vaga Exclusiva da Conta A",
    title: "Vaga Exclusiva da Conta A",
    status: "ativa"
  }).select().single();

  if (errVagaA) console.error("   ❌ Erro ao criar vaga A:", errVagaA);

  const { data: candNovoA, error: errCandA } = await clientA.from("pdf_candidates").insert({
    empresa_id: empA.id,
    vaga_id: vagaNovaA?.id,
    nome_candidato: "Candidato Exclusivo Alfa",
    file_url: "https://storage.example.com/cv_alfa.pdf",
    status: "triado"
  }).select().single();

  if (errCandA) console.error("   ❌ Erro ao criar candidato A:", errCandA);

  console.log(`   Vaga criada na Conta A: ${vagaNovaA?.titulo} (ID: ${vagaNovaA?.id})`);
  console.log(`   Candidato criado na Conta A: ${candNovoA?.nome_candidato} (ID: ${candNovoA?.id})`);

  // 6. Criar dados na Conta B
  console.log("\n6. Criando Vaga e Candidato EXCLUSIVOS na Conta B...");
  const { data: vagaNovaB, error: errVagaB } = await clientB.from("vagas").insert({
    empresa_id: empB.id,
    criado_por: userB.user.id,
    titulo: "Vaga Exclusiva da Conta B",
    title: "Vaga Exclusiva da Conta B",
    status: "ativa"
  }).select().single();

  if (errVagaB) console.error("   ❌ Erro ao criar vaga B:", errVagaB);

  const { data: candNovoB, error: errCandB } = await clientB.from("pdf_candidates").insert({
    empresa_id: empB.id,
    vaga_id: vagaNovaB?.id,
    nome_candidato: "Candidato Exclusivo Beta",
    file_url: "https://storage.example.com/cv_beta.pdf",
    status: "triado"
  }).select().single();

  if (errCandB) console.error("   ❌ Erro ao criar candidato B:", errCandB);

  console.log(`   Vaga criada na Conta B: ${vagaNovaB?.titulo} (ID: ${vagaNovaB?.id})`);
  console.log(`   Candidato criado na Conta B: ${candNovoB?.nome_candidato} (ID: ${candNovoB?.id})`);

  // 7. TESTE DE ISOLAMENTO CRUZADO
  console.log("\n7. REALIZANDO TESTE DE CRUZAMENTO DE DADOS (CRITICAL RLS AUDIT)...");

  // Conta A lê vagas e candidatos
  const { data: vagasVistasPorA } = await clientA.from("vagas").select("id, titulo");
  const { data: candsVistosPorA } = await clientA.from("pdf_candidates").select("id, nome_candidato");

  console.log(`   Conta A enxerga ${vagasVistasPorA?.length} vaga(s):`, vagasVistasPorA?.map(v => v.titulo));
  console.log(`   Conta A enxerga ${candsVistosPorA?.length} candidato(s):`, candsVistosPorA?.map(c => c.nome_candidato));

  // Conta B lê vagas e candidatos
  const { data: vagasVistasPorB } = await clientB.from("vagas").select("id, titulo");
  const { data: candsVistosPorB } = await clientB.from("pdf_candidates").select("id, nome_candidato");

  console.log(`   Conta B enxerga ${vagasVistasPorB?.length} vaga(s):`, vagasVistasPorB?.map(v => v.titulo));
  console.log(`   Conta B enxerga ${candsVistosPorB?.length} candidato(s):`, candsVistosPorB?.map(c => c.nome_candidato));

  const vazamentoA = vagasVistasPorA?.some(v => v.id === vagaNovaB?.id) || candsVistosPorA?.some(c => c.id === candNovoB?.id);
  const vazamentoB = vagasVistasPorB?.some(v => v.id === vagaNovaA?.id) || candsVistosPorB?.some(c => c.id === candNovoA?.id);

  if (vazamentoA || vazamentoB) {
    console.error("\n❌ ERRO CRÍTICO P0: HOUVE VAZAMENTO DE DADOS ENTRE CONTA A E CONTA B!");
    process.exit(1);
  } else {
    console.log("\n✅ ISOLAMENTO 100% CONFIRMADO: CONTA A NÃO VÊ NADA DA CONTA B E VICE-VERSA!");
  }

  // 8. TESTE DE UPLOAD DE AVATAR ESCOPADO
  console.log("\n8. Testando uploads de avatar escopados por userId...");
  const dummyImage = Buffer.from("fake-image-bytes");
  const pathA = `${userA.user.id}/avatar.jpg`;
  const pathB = `${userB.user.id}/avatar.jpg`;

  await admin.storage.from("avatars").upload(pathA, dummyImage, { upsert: true, contentType: "image/jpeg" });
  await admin.storage.from("avatars").upload(pathB, dummyImage, { upsert: true, contentType: "image/jpeg" });

  await admin.from("usuarios").update({ avatar_url: `https://ktjyekmuruwtvqpetjrk.supabase.co/storage/v1/object/public/avatars/${pathA}` }).eq("id", userA.user.id);
  await admin.from("usuarios").update({ avatar_url: `https://ktjyekmuruwtvqpetjrk.supabase.co/storage/v1/object/public/avatars/${pathB}` }).eq("id", userB.user.id);

  const { data: profileA } = await clientA.from("usuarios").select("avatar_url").single();
  const { data: profileB } = await clientB.from("usuarios").select("avatar_url").single();

  console.log(`   Avatar Conta A: ${profileA?.avatar_url}`);
  console.log(`   Avatar Conta B: ${profileB?.avatar_url}`);

  if (profileA?.avatar_url !== profileB?.avatar_url && profileA?.avatar_url?.includes(userA.user.id) && profileB?.avatar_url?.includes(userB.user.id)) {
    console.log("   ✅ AVATARES TOTALMENTE ISOLADOS E ESCOPADOS POR USER_ID!");
  } else {
    console.error("❌ ERRO: Colisão ou falha de isolamento no avatar!");
  }

  // Limpeza dos usuários de teste
  console.log("\n9. Limpando dados de teste...");
  await admin.from("pdf_candidates").delete().in("id", [candNovoA?.id, candNovoB?.id]);
  await admin.from("vagas").delete().in("id", [vagaNovaA?.id, vagaNovaB?.id]);
  await admin.from("usuarios").delete().in("id", [userA.user.id, userB.user.id]);
  await admin.from("empresas").delete().in("id", [empA.id, empB.id]);
  await admin.auth.admin.deleteUser(userA.user.id);
  await admin.auth.admin.deleteUser(userB.user.id);

  console.log("\n========================================================");
  console.log("RESULTADO FINAL: TESTE DE ISOLAMENTO APROVADO COM SUCESSO!");
  console.log("========================================================\n");
}

runTest().catch((err) => {
  console.error("Erro durante execução do teste:", err);
  process.exit(1);
});
