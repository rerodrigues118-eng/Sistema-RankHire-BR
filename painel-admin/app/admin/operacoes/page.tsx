import { createSupabaseAdminClient } from '@/lib/supabase';

type JobRecord = {
  id: string;
  status?: string | null;
  created_at: string;
  finished_at?: string | null;
};

export default async function OperacoesPage() {
  const supabase = createSupabaseAdminClient();
  const { data: jobs } = await supabase
    .from<JobRecord>('jobs')
    .select('id,status,created_at,finished_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ padding: 24 }}>
      <h1>Uso das APIs & Jobs</h1>
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
            <p style={{ color: '#8b949e' }}>Jobs recentes</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{jobs?.length ?? 0}</p>
          </div>
        </div>
        <div style={{ marginTop: 24, background: '#161b22', border: '1px solid #30363d', borderRadius: 20, padding: 24 }}>
          <h2>Últimos jobs</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead style={{ color: '#8b949e' }}>
              <tr><th>ID</th><th>Status</th><th>Início</th><th>Fim</th></tr>
            </thead>
            <tbody>
              {(jobs || []).map((job) => (
                <tr key={job.id} style={{ borderTop: '1px solid #23272b' }}>
                  <td style={{ padding: 10 }}>{job.id}</td>
                  <td style={{ padding: 10 }}>{job.status}</td>
                  <td style={{ padding: 10 }}>{new Date(job.created_at).toLocaleString()}</td>
                  <td style={{ padding: 10 }}>{job.finished_at ? new Date(job.finished_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
