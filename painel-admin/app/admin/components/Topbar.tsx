import React from "react";

export default function Topbar({ admin }: { admin: any }) {
  return (
    <header style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #23272b', background: '#0d1117' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'transparent', border: 'none', color: '#8b949e' }}>☰</button>
        <div style={{ fontWeight: 700 }}>RankHire BR Admin</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#8b949e' }}>{admin?.email ?? ''}</div>
      </div>
    </header>
  );
}
