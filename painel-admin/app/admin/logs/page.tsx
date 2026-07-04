import { createSupabaseAdminClient } from '@/lib/supabase';

export default async function LogsPage() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from('admin_logs').select('id,admin_id,acao,nivel,created_at').order('created_at', { ascending: false }).limit(50);

  return (
    <main style={{ padding: 24 }}>
      <h1>Logs do sistema</h1>
      <table style={{ width: '100%', marginTop: 12 }}>
        <thead style={{ color: '#8b949e' }}>
          <tr><th>Data</th><th>Admin</th><th>Ação</th><th>Nível</th></tr>
        </thead>
        <tbody>
          {(data || []).map((l: any) => (
            <tr key={l.id} style={{ borderTop: '1px solid #23272b' }}>
              <td style={{ padding: 8 }}>{new Date(l.created_at).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{l.admin_id}</td>
              <td style={{ padding: 8 }}>{l.acao}</td>
              <td style={{ padding: 8 }}>{l.nivel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
