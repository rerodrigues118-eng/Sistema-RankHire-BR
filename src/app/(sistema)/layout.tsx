"use client";

import Sidebar from "@/components/sidebar";
import TrialBanner from "@/components/TrialBanner";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
