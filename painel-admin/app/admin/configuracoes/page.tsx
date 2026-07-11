import { createSupabaseAdminClient } from '@/lib/supabase';
import ConfigEditor from './ConfigEditor';
import AdminTeamManager from './AdminTeamManager';

export default async function ConfiguracoesPage() {
  const supabase = createSupabaseAdminClient();
  const [{ data: configs }, { data: admins }] = await Promise.all([
    supabase.from('configuracoes_globais').select('chave,valor,descricao'),
    supabase.from('admin_usuarios').select('id,nome,email,role,ativo').order('created_at', { ascending: true }),
  ]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Configurações globais</h1>
      <p style={{ color: '#8b949e', marginTop: 8 }}>Ajuste parâmetros do sistema e gerencie a equipe de administradores.</p>
      <ConfigEditor configs={configs || []} />
      <AdminTeamManager initialAdmins={admins || []} />
    </main>
  );
}
