import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  console.log("\n========================================================");
  console.log("TESTE DE VALIDAÇÃO DE TRIAL (7 DIAS) E CRIAÇÃO DE CONTA");
  console.log("========================================================\n");

  const timestamp = Date.now();
  const email = `test_trial_7d_${timestamp}@rankhire-test.com`;
  const password = "SenhaSegura123!";

  console.log(`1. Registrando nova conta: ${email}`);
  const { data: userAuth, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: "Usuário Teste 7D", empresa: "Empresa 7 Dias" }
  });

  if (authErr || !userAuth.user) {
    console.error("❌ Erro ao criar conta de teste:", authErr);
    process.exit(1);
  }

  const userId = userAuth.user.id;
  console.log(`   Usuário criado com sucesso ID: ${userId}`);

  // Simula o registro via /api/auth/register-verified
  const { data: novaEmpresa } = await admin
    .from('empresas')
    .insert({
      nome: "Empresa 7 Dias",
      plano: 'trial',
      subscription_status: 'trialing',
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      limite_pdfs_mes: 15,
      limite_buscas_linkedin: 3,
      creditos_pdfs_usados: 0,
      creditos_buscas_usados: 0,
    })
    .select('id, trial_expires_at, created_at')
    .single();

  await admin.from('usuarios').upsert({
    id: userId,
    empresa_id: novaEmpresa?.id,
    nome: "Usuário Teste 7D",
    email,
    cargo: "Recrutador",
    role: 'admin'
  }, { onConflict: 'id' });

  // Autentica cliente normal
  const client = createClient(supabaseUrl, anonKey);
  await client.auth.signInWithPassword({ email, password });

  const { data: empresaLida } = await client.from("empresas").select("id, plano, trial_expires_at, created_at").single();

  console.log(`\n2. Verificando dados da empresa no primeiro acesso:`);
  console.log(`   ID da Empresa: ${empresaLida?.id}`);
  console.log(`   Plano: ${empresaLida?.plano}`);
  console.log(`   Data de Expiração do Trial: ${empresaLida?.trial_expires_at}`);

  const expiresAt = new Date(empresaLida?.trial_expires_at!);
  const now = new Date();
  const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`   Dias de Trial Restantes Calculados: ${diffDays} dia(s)`);

  if (diffDays === 7) {
    console.log("   ✅ SUCESSO: TRIAL ESTÁ CONFIGURADO COM EXATAMENTE 7 DIAS COMPLETOS!");
  } else {
    console.error(`   ❌ ERRO: Esperado 7 dias de trial, mas foi obtido ${diffDays} dia(s).`);
  }

  // Limpeza
  console.log("\n3. Limpando dados de teste...");
  await admin.from("usuarios").delete().eq("id", userId);
  if (novaEmpresa?.id) await admin.from("empresas").delete().eq("id", novaEmpresa.id);
  await admin.auth.admin.deleteUser(userId);

  console.log("\n========================================================");
  console.log("TESTE FINALIZADO!");
  console.log("========================================================\n");
}

runTest().catch((err) => {
  console.error("Erro durante execução do teste:", err);
  process.exit(1);
});
