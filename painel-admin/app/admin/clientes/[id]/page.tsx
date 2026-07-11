import { createSupabaseAdminClient } from '@/lib/supabase';
import ClienteTabs from './tabs';
import ClientActions from './components/ClientActions';

export default async function ClientePage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const supabase = createSupabaseAdminClient();
  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', params.id).single();

  if (!empresa) return <div>Empresa não encontrada.</div>;

  const tab = searchParams.tab || 'dados';

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>{empresa.nome}</h1>
          <p style={{ color: '#8b949e' }}>{empresa.status || '—'} · Plano {empresa.plano || '—'}</p>
        </div>
      </div>

      <ClientActions empresa={empresa} />
      <ClienteTabs id={params.id} />

      {tab === 'dados' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
            <h2>Informações básicas</h2>
            <p><strong>CNPJ:</strong> {empresa.cnpj || '—'}</p>
            <p><strong>Segmento:</strong> {empresa.segmento || '—'}</p>
            <p><strong>Email administrativo:</strong> {empresa.admin_email || '—'}</p>
            <p><strong>Plano atual:</strong> {empresa.plano || '—'}</p>
            <p><strong>Status assinatura:</strong> {empresa.subscription_status || '—'}</p>
          </div>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
            <h2>Notas internas</h2>
            <p style={{ color: '#8b949e' }}>{empresa.notas_internas || 'Nenhuma nota cadastrada.'}</p>
            <p style={{ marginTop: 16 }}><strong>Motivo de suspensão:</strong> {empresa.motivo_suspensao || '—'}</p>
          </div>
        </section>
      )}

      {tab === 'financeiro' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
            <h2>Plano e cobrança</h2>
            <p><strong>Plano atual:</strong> {empresa.plano || '—'}</p>
            <p><strong>Status assinatura:</strong> {empresa.subscription_status || '—'}</p>
            <p><strong>Data de expiração do trial:</strong> {empresa.trial_expires_at ? new Date(empresa.trial_expires_at).toLocaleDateString() : '—'}</p>
            <p><strong>MRR:</strong> R$ {(empresa.mrr_centavos ? Number(empresa.mrr_centavos) / 100 : 0).toLocaleString()}</p>
          </div>
        </section>
      )}

      {tab === 'usuarios' && (
        <section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
          <h2>Usuários</h2>
          <p style={{ color: '#8b949e' }}>Lista de usuários será mostrada aqui quando a integração estiver completa.</p>
        </section>
      )}

      {tab === 'uso' && (
        <section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
          <h2>Uso e métricas</h2>
          <p style={{ color: '#8b949e' }}>Dados de uso diário e limites ainda não estão disponíveis.</p>
        </section>
      )}

      {tab === 'historico' && (
        <section style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
          <h2>Histórico</h2>
          <p style={{ color: '#8b949e' }}>Histórico de ações do cliente será exibido aqui.</p>
        </section>
      )}
    </main>
  );
}
