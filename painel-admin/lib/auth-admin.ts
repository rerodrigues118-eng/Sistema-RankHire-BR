import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const SESSION_DURATION = "8h";

if (!JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET não está definido.");
}

export async function loginAdmin(email: string, senha: string) {
  const { data: admin, error } = await supabaseAdmin
    .from("admin_usuarios")
    .select("*")
    .eq("email", email)
    .eq("ativo", true)
    .single();

  if (error || !admin) {
    throw new Error("Credenciais inválidas");
  }

  if (admin.bloqueado_ate && new Date(admin.bloqueado_ate) > new Date()) {
    const minutos = Math.ceil(
      (new Date(admin.bloqueado_ate).getTime() - Date.now()) / 60000
    );
    throw new Error(`Conta bloqueada. Tente novamente em ${minutos} minutos.`);
  }

  const senhaCorreta = await bcrypt.compare(senha, admin.senha_hash);
  if (!senhaCorreta) {
    throw new Error("Credenciais inválidas");
  }

  const token = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      nome: admin.nome,
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );

  return { token, admin: { id: admin.id, nome: admin.nome, role: admin.role } };
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      adminId: string;
      email: string;
      role: string;
      nome: string;
    };
  } catch {
    return null;
  }
}
