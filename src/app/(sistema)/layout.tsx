"use client";

import Sidebar from "@/components/sidebar";
import TrialBanner from "@/components/TrialBanner";
import { NotificationProvider } from "@/context/NotificationContext";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          <TrialBanner />
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}
