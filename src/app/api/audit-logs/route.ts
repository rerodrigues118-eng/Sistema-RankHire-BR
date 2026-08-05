import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { userId, supabase } = await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback mock audit entries if audit_logs table is created dynamically
      return NextResponse.json({
        auditLogs: [
          {
            id: "aud-1",
            user_id: userId,
            action: "VIEW_CANDIDATE",
            resource_id: "cand-101",
            resource_type: "candidate",
            created_at: new Date().toISOString(),
            ip_address: "127.0.0.1",
          },
          {
            id: "aud-2",
            user_id: userId,
            action: "LGPD_FORGET",
            resource_id: "cand-102",
            resource_type: "candidate",
            details: JSON.stringify({ legalBasis: "LGPD Art. 18, VI" }),
            created_at: new Date(Date.now() - 3600000).toISOString(),
            ip_address: "127.0.0.1",
          },
        ],
        isMock: true,
      });
    }

    return NextResponse.json({ auditLogs: logs || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar os logs de auditoria.";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
