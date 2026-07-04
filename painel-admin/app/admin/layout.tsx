import React from "react";
import { cookies } from "next/headers";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { getSessionCookieName, getAdminSessionByToken } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const metadata = {
  title: "Painel Admin - RankHire",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(getSessionCookieName())?.value;
  if (!token) {
    return <div style={{ padding: 48, color: '#e6edf3' }}>Acesso não autorizado.</div>;
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return <div style={{ padding: 48, color: '#e6edf3' }}>Sessão inválida.</div>;
  }

  const adminClient = createSupabaseAdminClient();
  const { data: admins } = await adminClient.from('admin_usuarios').select('id,nome,email,role').eq('id', session.admin_id).limit(1).single();

  const impersonationId = cookies().get("rankhire_admin_impersonation")?.value;
  let impersonationEmpresa: { id: string; nome: string } | null = null;

  if (impersonationId) {
    const { data: empresa } = await adminClient
      .from('empresas')
      .select('id,nome')
      .eq('id', impersonationId)
      .limit(1)
      .single();
    if (empresa) {
      impersonationEmpresa = empresa;
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <aside style={{ width: 260 }}>
        <Sidebar admin={admins ?? null} />
      </aside>
      <div style={{ flex: 1 }}>
        <Topbar admin={admins ?? null} />
        {impersonationEmpresa ? (
          <div style={{ padding: 24, background: '#1f2937', borderBottom: '1px solid #23272b', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <strong>Impersonando empresa:</strong> {impersonationEmpresa.nome} ({impersonationEmpresa.id})
              </div>
              <a
                href="/api/admin/impersonate?stop=1&redirect=/admin/overview"
                style={{ background: '#7f1d1d', color: '#fff', padding: '10px 16px', borderRadius: 10, textDecoration: 'none' }}
              >
                Encerrar impersonação
              </a>
            </div>
          </div>
        ) : null}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
