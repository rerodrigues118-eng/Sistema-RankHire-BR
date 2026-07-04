import { cookies } from "next/headers";
import { getSessionCookieName, getAdminSessionByToken } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

function metricCard(title: string, value: string, subtitle: string) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24 }}>
      <p style={{ color: "#8b949e", marginBottom: 12 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{value}</p>
      <p style={{ color: "#8b949e", fontSize: 14 }}>{subtitle}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const token = cookies().get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: empresas }, { data: trials }, { data: totalClientes }, { data: churnLogs }] = await Promise.all([
    supabase.from("empresas").select("id").eq("status", "ativo"),
    supabase.from("empresas").select("id").eq("status", "trial"),
    supabase.from("empresas").select("id"),
    supabase.from("admin_logs").select("id").eq("acao", "churn").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const mrr = 0;
  const clientesAtivos = empresas?.length ?? 0;
  const trialsAtivos = trials?.length ?? 0;
  const churnCount = churnLogs?.length ?? 0;

  return (
    <main style={{ minHeight: "100vh", padding: "32px", background: "#0d1117" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", color: "#e6edf3" }}>
        <header style={{ marginBottom: 32 }}>
          <p style={{ color: "#8b949e", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Painel Administrativo
          </p>
          <h1 style={{ fontSize: 36, margin: "12px 0" }}>Overview</h1>
          <p style={{ color: "#8b949e", maxWidth: 640 }}>
            Visão geral do sistema, métricas em tempo real e últimos movimentos.
          </p>
        </header>

        <section style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {metricCard("MRR", `R$ ${mrr.toLocaleString()}`, "Variação vs mês anterior")}
          {metricCard("Clientes ativos", `${clientesAtivos}`, "Ativos no sistema")}
          {metricCard("Trials ativos", `${trialsAtivos}`, "Assinantes em período de avaliação")}
          {metricCard("Churn do mês", `${churnCount}`, "Cancelamentos detectados")}
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 18 }}>Atividade recente</h2>
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24 }}>
            <p style={{ color: "#8b949e" }}>As últimas ações do sistema estarão disponíveis aqui assim que o painel estiver totalmente integrado.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
