"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, CreditCard, 
  Clock, Activity, ScrollText, Settings, ShieldAlert 
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const MENU_ITEMS = [
    { label: "Overview", icon: LayoutDashboard, href: "/sys-control" },
    { label: "Clientes", icon: Users, href: "/sys-control/clientes" },
    { label: "Financeiro", icon: CreditCard, href: "/sys-control/financeiro" },
    { label: "Trials Expirando", icon: Clock, href: "/sys-control/trials" },
    { label: "Logs do Sistema", icon: ScrollText, href: "/sys-control/logs" },
    { label: "Configurações", icon: Settings, href: "/sys-control/configuracoes" },
  ];

  return (
    <div className="w-[240px] bg-[#0A0F1E] flex flex-col h-full border-r border-[#1F2937] text-white flex-shrink-0">
      
      {/* Brand & Badge */}
      <div className="h-16 flex items-center px-6 border-b border-[#1F2937] shrink-0 gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00B4D8] to-[#06D6A0] flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-[16px]">R</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[16px] leading-none tracking-tight">RankHire.</span>
          <span className="text-[#06D6A0] text-[10px] font-bold tracking-widest mt-1">ADMINISTRADOR</span>
        </div>
      </div>

      {/* Warning Area */}
      <div className="p-4 mx-4 mt-6 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-red-200 leading-tight">
          Acesso restrito. Todas as ações realizadas neste painel são auditadas e irreversíveis.
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/sys-control" && pathname?.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium ${
                isActive 
                  ? "bg-[#111827] text-white border border-[#1F2937]" 
                  : "text-[#9CA3AF] hover:bg-[#111827] hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-[#06D6A0]" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
