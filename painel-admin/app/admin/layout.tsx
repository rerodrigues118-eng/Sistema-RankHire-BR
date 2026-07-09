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
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return <div className="admin-message unauthorized-message">Acesso não autorizado.</div>;
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return <div className="admin-message unauthorized-message">Sessão inválida.</div>;
  }

  const adminClient = createSupabaseAdminClient();
  const { data: admins } = await adminClient.from('admin_usuarios').select('id,nome,email,role').eq('id', session.admin_id).limit(1).single();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Sidebar admin={admins ?? null} />
      </aside>
      <div className="main-area">
        <Topbar admin={admins ?? null} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}
