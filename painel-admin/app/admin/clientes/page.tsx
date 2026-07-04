import { createSupabaseAdminClient } from '@/lib/supabase';
import Link from 'next/link';

export default async function ClientesPage() {
  const supabase = createSupabaseAdminClient();
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id,nome,plano,status,created_at,admin_email')
    .limit(100);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div>
          <h1>Todos os clientes</h1>
          <p style={{ color: '#8b949e' }}>Veja e gerencie todas as empresas cadastradas.</p>
        </div>
        <a
          href="/api/admin/export-clientes"
          style={{ background: '#238636', color: '#fff', padding: '12px 18px', borderRadius: 10, textDecoration: 'none' }}
        >
          Exportar CSV
        </a>
      </div>
      <div style={{ marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#8b949e' }}>
              <th>Empresa</th>
              <th>Contato</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(empresas || []).map((empresa: any) => (
              <tr key={empresa.id} style={{ borderTop: '1px solid #23272b' }}>
                <td style={{ padding: 12 }}>{empresa.nome}</td>
                <td style={{ padding: 12 }}>{empresa.admin_email || '—'}</td>
                <td style={{ padding: 12 }}>{empresa.plano ?? '—'}</td>
                <td style={{ padding: 12 }}>{empresa.status ?? '—'}</td>
                <td style={{ padding: 12 }}>{new Date(empresa.created_at).toLocaleDateString()}</td>
                <td style={{ padding: 12 }}>
                  <Link href={`/admin/clientes/${empresa.id}`}>Gerenciar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
