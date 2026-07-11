import { cookies } from "next/headers";
import { getSessionCookieName, getAdminSessionByToken } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

function metricCard(title: string, value: string, subtitle: string) {
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-subtitle">{subtitle}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return null;
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();

  const [{ data: empresas }, { data: trials }, { data: churnLogs }] = await Promise.all([
    supabase.from("empresas").select("id").eq("status", "ativo"),
    supabase.from("empresas").select("id").eq("status", "trial"),
    supabase.from("admin_logs").select("id").eq("acao", "churn").gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const mrr = 0;
  const clientesAtivos = empresas?.length ?? 0;
  const trialsAtivos = trials?.length ?? 0;
  const churnCount = churnLogs?.length ?? 0;

  return (
    <main className="overview-page">
      <div className="content-block">
        <section className="section-panel">
          <div className="section-header">
            <div className="section-heading">
              <p className="section-label">Painel Administrativo</p>
              <h1>Overview</h1>
              <p>Visão geral do sistema, métricas principais e atividade recente do painel.</p>
            </div>
            <div className="status-pill">Atualizado nos últimos 30 dias</div>
          </div>

          <div className="metric-grid">
            {metricCard('Receita mensal recorrente', `R$ ${mrr.toLocaleString()}`, 'Variação vs mês anterior')}
            {metricCard('Clientes ativos', `${clientesAtivos}`, 'Empresas com status ativo')}
            {metricCard('Trials ativos', `${trialsAtivos}`, 'Empresas em avaliação')}
            {metricCard('Churn mensal', `${churnCount}`, 'Cancelamentos registrados')}
          </div>
        </section>

        <section className="section-panel activity-panel">
          <div className="section-header">
            <h2>Atividade recente</h2>
            <span className="status-pill">Ativo</span>
          </div>
          <div className="activity-card">
            <p>As últimas ações do sistema estarão disponíveis aqui assim que o painel estiver totalmente integrado.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
