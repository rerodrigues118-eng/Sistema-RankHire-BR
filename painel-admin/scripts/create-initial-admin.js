#!/usr/bin/env node
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env antes de rodar este script.");
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Uso: node create-initial-admin.js <email> <password>");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await supabase.from("admin_usuarios").select("id").limit(1);
  if (existing && existing.length > 0) {
    console.error("Já existe pelo menos um usuário admin. Abortando para evitar sobrescrever.");
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);

  const { data, error } = await supabase.from("admin_usuarios").insert({
    nome: email.split("@")[0],
    email: email.toLowerCase(),
    senha_hash: hash,
    role: "superadmin",
    ativo: true,
  }).select("id,email").single();

  if (error) {
    console.error("Erro ao criar admin:", error.message || error);
    process.exit(1);
  }

  console.log("Admin criado:", data);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
