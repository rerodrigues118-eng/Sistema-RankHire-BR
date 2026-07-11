"use client";

import Link from 'next/link';

export default function ClienteTabs({ id }: { id: string }) {
  const tabs = [
    { label: 'Dados', href: `/admin/clientes/${id}` },
    { label: 'Plano & Cobrança', href: `/admin/clientes/${id}?tab=financeiro` },
    { label: 'Usuários', href: `/admin/clientes/${id}?tab=usuarios` },
    { label: 'Uso & Métricas', href: `/admin/clientes/${id}?tab=uso` },
    { label: 'Histórico', href: `/admin/clientes/${id}?tab=historico` },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} style={{ padding: '10px 16px', borderRadius: 12, textDecoration: 'none', background: '#161b22', border: '1px solid #30363d', color: '#e6edf3' }}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
