import { handleApiError } from "@/lib/api";
import { requireAdminContext } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { admin } = await requireAdminContext();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "25")));
    const offset = (page - 1) * limit;
    const query = searchParams.get("q")?.trim() || "";

    let db = admin
      .from("admin_logs")
      .select("id,admin_id,empresa_id,acao,detalhes,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      db = db.ilike("acao", `%${query}%`);
    }

    const { data, error, count } = await db;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: (data || []).map((log) => ({
        id: log.id,
        admin_id: log.admin_id || null,
        empresa_id: log.empresa_id || null,
        acao: String(log.acao || "").trim() || "evento",
        detalhes: log.detalhes && typeof log.detalhes === "object" ? log.detalhes : {},
        created_at: log.created_at || new Date().toISOString(),
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
