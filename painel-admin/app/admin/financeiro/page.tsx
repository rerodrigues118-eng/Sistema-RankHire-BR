import { createSupabaseAdminClient } from '@/lib/supabase';

type EmpresaPlan = {
  plano?: string | null;
  mrr_centavos?: number | string | null;
};

export default async function FinanceiroPage() {
  const supabase = createSupabaseAdminClient();
  const { data: planos } = await supabase.from<EmpresaPlan>('empresas').select('plano,mrr_centavos').not('plano', 'is', null);

  const totals = (planos || []).reduce((acc: { [key: string]: number }, item) => {
    const plano = item.plano || 'outros';
    acc[plano] = (acc[plano] || 0) + Number(item.mrr_centavos || 0);
    return acc;
  }, {});

  const mrrTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return (
    <main style={{ padding: 24 }}>
      <h1>Financeiro</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 20 }}>
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
          <p style={{ color: '#8b949e' }}>MRR Atual</p>
          <p style={{ fontSize: 32, fontWeight: 700 }}>R$ {mrrTotal.toLocaleString()}</p>
        </div>
        {Object.entries(totals).map(([plano, value]) => (
          <div key={plano} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
            <p style={{ color: '#8b949e' }}>{plano}</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>R$ {Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
