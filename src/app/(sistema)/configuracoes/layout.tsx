import React from "react";

export const metadata = {
  title: "Configurações — RankHire BR",
};

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="flex-1 p-0">
        {children}
      </main>
    </div>
  );
}
