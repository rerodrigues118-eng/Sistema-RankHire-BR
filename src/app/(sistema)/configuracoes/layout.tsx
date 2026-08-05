import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Configurações — RankHire BR",
};

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside className="w-64 min-w-[220px] border-r border-[#E5E7EB] bg-[#FAFAFA] p-6 overflow-y-auto scrollbar-hide">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Configurações</h3>
        <nav className="flex flex-col gap-2">
          <Link href="/configuracoes" className="px-3 py-2 rounded-md text-sm text-[#374151] hover:bg-[#F3F4F6]">Perfil e Segurança</Link>
          <Link href="/configuracoes/plano" className="px-3 py-2 rounded-md text-sm text-[#374151] hover:bg-[#F3F4F6]">Plano e Cobrança</Link>
        </nav>
      </aside>

      <main className="flex-1 p-0">
        {children}
      </main>
    </div>
  );
}
