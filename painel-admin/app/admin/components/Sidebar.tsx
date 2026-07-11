"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clock3, CreditCard, Settings2, FileText, Bell, SlidersHorizontal } from "lucide-react";

type AdminProfile = {
  role?: string | null;
  nome?: string | null;
  email?: string | null;
};

export default function Sidebar({ admin }: { admin: AdminProfile | null }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/trials", label: "Trials", icon: Clock3 },
    ...(admin?.role === "superadmin" || admin?.role === "financeiro" ? [{ href: "/admin/financeiro", label: "Financeiro", icon: CreditCard }] : []),
    { href: "/admin/operacoes", label: "Operações", icon: Settings2 },
    ...(admin?.role === "superadmin" || admin?.role === "suporte" ? [{ href: "/admin/logs", label: "Logs", icon: FileText }, { href: "/admin/alerts", label: "Alertas", icon: Bell }] : []),
    ...(admin?.role === "superadmin" ? [{ href: "/admin/configuracoes", label: "Configurações", icon: SlidersHorizontal }] : []),
  ];

  return (
    <div className="sidebar-inner">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">RankHire BR</div>
        <div className="sidebar-brand-badge">ADMIN</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-profile">
        <div className="profile-row">
          <div className="profile-avatar">{admin?.nome ? admin.nome.slice(0, 2).toUpperCase() : "RH"}</div>
          <div className="profile-details">
            <div className="profile-name">{admin?.nome ?? "Administrador"}</div>
            <div className="profile-role">{admin?.role ?? "admin"}</div>
          </div>
        </div>

        <a className="logout-link" href="/api/auth/logout">
          Sair
        </a>
      </div>
    </div>
  );
}
