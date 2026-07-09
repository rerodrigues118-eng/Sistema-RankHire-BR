import { createSupabaseAdminClient } from '@/lib/supabase';
import Link from 'next/link';

type EmpresaSummary = {
  id: string;
  nome?: string | null;
  plano?: string | null;
  status?: string | null;
  created_at: string;
  admin_email?: string | null;
};

export default async function ClientesPage() {
  const supabase = createSupabaseAdminClient();
  const { data: empresas } = await supabase
    .from<EmpresaSummary>('empresas')
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
            {(empresas || []).map((empresa) => (
              <tr key={empresa.id} style={{ borderTop: '1px solid #23272b' }}>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{empresa.nome}</span>
                    <Link href={`/admin/clientes/${empresa.id}`} aria-label={`Editar ${empresa.nome}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                        <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
                      </svg>
                    </Link>
                  </div>
                </td>
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
