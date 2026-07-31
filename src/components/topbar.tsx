"use client";

import React, { useEffect, useState } from "react";
import type { Job, PageId } from "@/lib/types";
import { ChevronRight, ChevronDown, Plus, Sun, Moon } from "lucide-react";
import NotificationPopover from "@/components/NotificationPopover";

interface TopbarProps {
  activeJob: Job | null;
  activePage: PageId;
  totalCount: number;
  processedCount: number;
}

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Dashboard",
  vagas: "Vagas",
  linkedin: "Busca Inteligente",
  "agente-ia": "Agente IA",
  "pdf-ranker": "PDF Ranker",
  candidatos: "Candidatos (CRM)",
  pipeline: "Pipeline",
  analytics: "Analytics",
  settings: "Configurações",
};

export default function Topbar({
  activeJob,
  activePage,
  totalCount,
  processedCount,
}: TopbarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    }
  };

  const themeToggleButton = (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg text-[#4B5563] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
      title={theme === "light" ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );

  if (activePage === "dashboard") {
    return (
      <header
        className="h-[48px] bg-[#FFFFFF] dark:bg-slate-900 flex items-center justify-end px-6 flex-shrink-0 transition-colors"
        style={{ borderBottom: "1px solid var(--border-sidebar)" }}
      >
        <div className="flex items-center gap-4">
          {themeToggleButton}
          <NotificationPopover />
          <div className="w-px h-5 bg-[#E5E7EB] dark:bg-slate-800" />
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center text-[#4B5563] dark:text-gray-300 text-[12px] font-medium">
              MH
            </div>
            <span className="text-[13px] text-[#374151] dark:text-gray-300 font-medium group-hover:text-[#111827] dark:group-hover:text-white">
              RankHire
            </span>
            <ChevronDown size={14} className="text-[#9CA3AF]" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="h-[48px] bg-[#FFFFFF] dark:bg-slate-900 flex items-center justify-between px-6 flex-shrink-0 transition-colors"
      style={{ borderBottom: "1px solid var(--border-sidebar)" }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#6B7280] dark:text-gray-400">
        <span>{PAGE_LABELS[activePage]}</span>
        <ChevronRight size={14} className="text-[#D1D5DB]" />
        <span className="font-medium text-[#374151] dark:text-white">
          {activeJob?.title || "Nenhuma vaga selecionada"}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {processedCount > 0 && processedCount < totalCount && (
          <span className="text-[12px] text-[#059669] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#06D6A0] rounded-full" />
            Processando PDFs ({processedCount}/{totalCount})
          </span>
        )}

        <button className="bg-[#06D6A0] hover:bg-[#059669] text-white text-[13px] font-medium rounded-[6px] px-3.5 py-1.5 flex items-center gap-1.5 transition-colors">
          <Plus size={16} />
          Nova vaga
        </button>

        {themeToggleButton}

        <NotificationPopover />

        <div className="w-px h-5 bg-[#E5E7EB] dark:bg-slate-800" />

        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center text-[#4B5563] dark:text-gray-300 text-[12px] font-medium">
            MH
          </div>
          <span className="text-[13px] text-[#374151] dark:text-gray-300 font-medium group-hover:text-[#111827] dark:group-hover:text-white">
            RankHire
          </span>
          <ChevronDown size={14} className="text-[#9CA3AF]" />
        </div>
      </div>
    </header>
  );
}
