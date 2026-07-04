import { createSupabaseAdminClient } from '@/lib/supabase';

export default async function TrialsPage() {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString();
  const { data } = await supabase
    .from('empresas')
    .select('id,nome,email,plano,status,trial_ends_at')
    .gte('trial_ends_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order('trial_ends_at', { ascending: true })
    .limit(100);

  return (
    <main style={{ padding: 24 }}>
      <h1>Trials expirando</h1>
      <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
        {(data || []).map((cliente: any) => {
          const endsAt = cliente.trial_ends_at ? new Date(cliente.trial_ends_at) : null;
          const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
          const statusLabel = daysLeft !== null ? `${daysLeft} dias restantes` : 'Sem data';
          const color = daysLeft !== null ? (daysLeft <= 3 ? '#da3633' : daysLeft <= 7 ? '#d29922' : '#238636') : '#8b949e';

          return (
            <div key={cliente.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{cliente.nome}</h2>
                <p style={{ color: '#8b949e', margin: '6px 0' }}>{cliente.email}</p>
                <p style={{ color: color, margin: 0 }}>{statusLabel}</p>
              </div>
              <div>
                <button style={{ background: '#238636', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 10, cursor: 'pointer' }}>Enviar lembrete</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
