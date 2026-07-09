import { ApiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL_ALLOWLIST = new Set([
  "delski.contato@gmail.com",
]);

function normalizeRole(role: string | null | undefined) {
  return String(role || "").trim().toLowerCase();
}

export async function requireAuth(): Promise<{
  userId: string;
  user: typeof user;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError("Nao autorizado.", 401);
  }

  return { userId: user.id, user, supabase };
}

export async function requireSuperAdmin(): Promise<{
  userId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const { userId, supabase } = await requireAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("usuarios")
    .select("role")
    .eq("id", userId)
    .single();

  const role = normalizeRole(profile?.role);
  const email = String(user?.email || "").trim().toLowerCase();

  if (role !== "superadmin" && role !== "admin" && (!email || !ADMIN_EMAIL_ALLOWLIST.has(email))) {
    throw new ApiError("Acesso negado. Apenas administradores.", 403);
  }

  return { userId, supabase };
}
