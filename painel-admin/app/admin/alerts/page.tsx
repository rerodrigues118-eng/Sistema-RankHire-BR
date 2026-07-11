import { createSupabaseAdminClient } from '@/lib/supabase';

type AlertItem = {
  id: string;
  tipo: string;
  nivel: string;
  descricao?: string | null;
  ip_origem?: string | null;
  resolvido?: boolean | null;
  created_at: string;
};

export default async function AlertsPage() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from<AlertItem>('alertas_seguranca')
    .select('id,tipo,nivel,descricao,ip_origem,empresa_id,resolvido,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: 24 }}>
      <h1>Alertas de segurança</h1>
      <div style={{ marginTop: 24, background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ color: '#8b949e' }}>
            <tr><th>Data</th><th>Tipo</th><th>Nível</th><th>Descrição</th><th>IP</th><th>Resolvido</th></tr>
          </thead>
          <tbody>
            {(data || []).map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #23272b' }}>
                <td style={{ padding: 10 }}>{new Date(item.created_at).toLocaleString()}</td>
                <td style={{ padding: 10 }}>{item.tipo}</td>
                <td style={{ padding: 10 }}>{item.nivel}</td>
                <td style={{ padding: 10 }}>{item.descricao}</td>
                <td style={{ padding: 10 }}>{item.ip_origem ?? '-'}</td>
                <td style={{ padding: 10 }}>{item.resolvido ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
