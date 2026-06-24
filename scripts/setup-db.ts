import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupDatabase() {
  console.log("Iniciando setup...");

  // 1. Criar o usuário
  const email = "superadmin@delski.com";
  const password = "password123";

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Pula a etapa de confirmação de email
  });

  if (userError) {
    if (userError.message.includes("already exists")) {
      console.log("Usuário já existe. Seguindo...");
    } else {
      console.error("Erro ao criar usuário:", userError);
      return;
    }
  } else {
    console.log(`Usuário criado: ${email} | Senha: ${password}`);
  }

  // 2. Tentar resgatar o ID do usuário se já existia
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === email);

  if (!targetUser) {
    console.error("Não foi possível encontrar o UUID do usuário.");
    return;
  }

  // 3. Criar uma vaga atrelada a este usuário (se não existir)
  const { data: vagaData, error: vagaError } = await supabaseAdmin
    .from("vagas")
    .insert({
      user_id: targetUser.id,
      title: "Senior Full Stack Engineer",
      briefing: "Procuramos um desenvolvedor Sênior com sólida experiência em React, Node.js e arquiteturas Cloud (AWS/Supabase). Diferencial para conhecimento em IA/LLMs.",
      status: "active"
    })
    .select()
    .single();

  if (vagaError) {
    console.error("Erro ao criar Vaga:", vagaError);
    return;
  }

  console.log("Vaga teste criada:", vagaData.title);

  // 4. Inserir os critérios para a vaga
  const criteriaList = [
    { vaga_id: vagaData.id, description: "Experiência sólida com React/Next.js e Node.js", weight: 5 },
    { vaga_id: vagaData.id, description: "Conhecimentos em arquitetura de microsserviços e bancos de dados (SQL)", weight: 4 },
    { vaga_id: vagaData.id, description: "Familiaridade com integração de APIs e orquestração assíncrona (BullMQ)", weight: 4 },
    { vaga_id: vagaData.id, description: "Vivência em times ágeis e capacidade de arquitetar soluções do zero", weight: 3 }
  ];

  const { error: critError } = await supabaseAdmin.from("criteria").insert(criteriaList);

  if (critError) {
    console.error("Erro ao inserir critérios:", critError);
  } else {
    console.log("4 Critérios cadastrados com sucesso para a Vaga.");
  }

  console.log("Setup finalizado! Você já pode fazer login.");
}

setupDatabase();
