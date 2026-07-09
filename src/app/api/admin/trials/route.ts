import { requireAuth } from "@/lib/auth-guard";
import { handleApiError } from "@/lib/api";
import { requireAdminContext } from "@/lib/admin";
import { NextResponse } from "next/server";

function normalizeRole(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value: string | null | undefined, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

type TrialRow = {
  id: string;
  nome: string | null;
  admin_email?: string | null;
  trial_expires_at: string;
  usuarios?: { email: string | null; role: string | null }[];
};

export async function GET() {
  const { userId, supabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const { admin } = await requireAdminContext();
    const hoje = new Date();
    const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await admin
      .from("empresas")
      .select("id,nome,admin_email,trial_expires_at,usuarios(email,role)")
      .lte("trial_expires_at", em7dias.toISOString())
      .gte("trial_expires_at", hoje.toISOString())
      .order("trial_expires_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const trials = ((data || []) as TrialRow[]).map((emp) => {
      const adminUser =
        emp.usuarios?.find((u) => ["admin", "superadmin"].includes(normalizeRole(u.role))) ||
        emp.usuarios?.[0];
      const trialExpires = new Date(emp.trial_expires_at);
      const diasRestantes = Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      return {
        id: emp.id,
        empresa: normalizeText(emp.nome, "Empresa sem nome"),
        email: normalizeText(adminUser?.email || emp.admin_email),
        dias_restantes: diasRestantes,
        trial_expires_at: emp.trial_expires_at,
      };
    });

    return NextResponse.json({ trials });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
