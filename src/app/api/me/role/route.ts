import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

const ADMIN_EMAIL_ALLOWLIST = new Set([
  "delski.contato@gmail.com",
]);

function normalizeRole(role: string | null | undefined) {
  return String(role || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("usuarios")
      .select("role")
      .eq("id", userId)
      .single();

    const role = normalizeRole(data?.role);
    const email = String(user?.email || "").trim().toLowerCase();

    return NextResponse.json({
      role: role || null,
      isAdmin:
        role === "admin" ||
        role === "superadmin" ||
        Boolean(email && ADMIN_EMAIL_ALLOWLIST.has(email)),
      email: user?.email || null,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
