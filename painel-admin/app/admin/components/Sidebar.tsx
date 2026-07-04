import React from "react";

export default function Sidebar({ admin }: { admin: any }) {
  return (
    <div style={{ height: '100vh', background: '#0b0f13', borderRight: '1px solid #23272b', color: '#e6edf3', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #23272b' }}>
        <div style={{ fontWeight: 700 }}>RankHire BR · Admin <span style={{ background: '#da3633', padding: '2px 6px', borderRadius: 6, marginLeft: 8, fontSize: 12 }}>ADMIN</span></div>
      </div>

      <nav style={{ padding: 16, flex: 1 }}>
        <div style={{ marginBottom: 12 }}><a href="/admin/overview">📊 Overview</a></div>
        <div style={{ marginBottom: 12 }}><a href="/admin/clientes">👥 Clientes</a></div>
        <div style={{ marginBottom: 12 }}><a href="/admin/trials">⏳ Trials</a></div>
        {(admin?.role === 'superadmin' || admin?.role === 'financeiro') && (
          <div style={{ marginBottom: 12 }}><a href="/admin/financeiro">💰 Financeiro</a></div>
        )}
        <div style={{ marginBottom: 12 }}><a href="/admin/operacoes">⚙️ Operações</a></div>
        {(admin?.role === 'superadmin' || admin?.role === 'suporte') && (
          <div style={{ marginBottom: 12 }}><a href="/admin/logs">📜 Logs</a></div>
        )}
        {(admin?.role === 'superadmin' || admin?.role === 'suporte') && (
          <div style={{ marginBottom: 12 }}><a href="/admin/alerts">🚨 Alertas</a></div>
        )}
        {(admin?.role === 'superadmin') && (
          <div style={{ marginBottom: 12 }}><a href="/admin/configuracoes">⚙️ Configurações</a></div>
        )}
        <div style={{ marginTop: 24, borderTop: '1px solid #23272b', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#161b22' }}></div>
            <div>
              <div style={{ fontWeight: 700 }}>{admin?.nome ?? '—'}</div>
              <div style={{ color: '#8b949e', fontSize: 12 }}>{admin?.role ?? ''}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="/api/auth/logout">Logout</a>
          </div>
        </div>
      </nav>
    </div>
  );
}
