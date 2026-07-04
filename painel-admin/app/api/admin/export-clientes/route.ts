import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

function toCsv(rows: any[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(";")];
  rows.forEach((row) => {
    const line = headers.map((key) => {
      const value = row[key] ?? "";
      return String(value).replace(/"/g, '""');
    });
    csv.push(line.join(";"));
  });
  return csv.join("\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const plano = url.searchParams.get("plano") || undefined;

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("empresas").select("nome,admin_email,plano,status,created_at,mrr_centavos");

  if (search) query = query.ilike("nome", `%${search}%`);
  if (status) query = query.eq("status", status);
  if (plano) query = query.eq("plano", plano);

  const { data, error } = await query.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = toCsv(data || []);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=clientes.csv",
    },
  });
}
