"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { getPageFromPath } from "@/lib/routes";
import { NotificationProvider } from "@/context/NotificationContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activePage = getPageFromPath(pathname ?? "/dashboard") ?? "dashboard";

  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-page)] font-sans">
        <Sidebar activePage={activePage} />
        <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      </div>
    </NotificationProvider>
  );
}
