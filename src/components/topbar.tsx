"use client";

import React from "react";
import type { Job, PageId } from "@/lib/types";
import { ChevronRight, Bell, ChevronDown, Plus } from "lucide-react";

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
  // Se for dashboard, a topbar pode ser mais limpa ou oculta dependendo do layout.
  // Como o usuário pediu o título direto no dashboard, vamos manter a topbar apenas para as outras páginas,
  // ou torná-la puramente navegacional.
  
  if (activePage === "dashboard") {
    // No dashboard do Juicebox não há topbar pesada, apenas o cabeçalho "Olá Mateus" na própria página.
    // Vamos retornar nulo ou uma barra muito invisível se necessário,
    // mas o layout usa a topbar. Vamos retornar uma barra vazia ou com ações globais.
    return (
      <header className="h-[48px] bg-[#FFFFFF] flex items-center justify-end px-10 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-sidebar)" }}>
         <div className="flex items-center gap-4">
          <button className="text-[#6B7280] hover:text-[#111827] transition-colors relative">
            <Bell size={18} strokeWidth={2} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-px h-5 bg-[#E5E7EB]" />
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#4B5563] text-[12px] font-medium">
              MH
            </div>
            <span className="text-[13px] text-[#374151] font-medium group-hover:text-[#111827]">RankHire</span>
            <ChevronDown size={14} className="text-[#9CA3AF]" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="h-[48px] bg-[#FFFFFF] flex items-center justify-between px-10 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border-sidebar)" }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
        <span>{PAGE_LABELS[activePage]}</span>
        <ChevronRight size={14} className="text-[#D1D5DB]" />
        <span className="font-medium text-[#374151]">{activeJob?.title || "Nenhuma vaga selecionada"}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">
        {processedCount > 0 && processedCount < totalCount && (
          <span className="text-[12px] text-[#059669] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#06D6A0] rounded-full" />
            Processando PDFs ({processedCount}/{totalCount})
          </span>
        )}

        <button className="bg-[#06D6A0] hover:bg-[#059669] text-white text-[13px] font-medium rounded-[6px] px-4 py-1.5 flex items-center gap-1.5 transition-colors">
          <Plus size={16} />
          Nova vaga
        </button>

        <button className="text-[#6B7280] hover:text-[#111827] transition-colors relative ml-1">
          <Bell size={20} strokeWidth={1.5} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-5 bg-[#E5E7EB]" />

        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#4B5563] text-[12px] font-medium">
            MH
          </div>
          <span className="text-[13px] text-[#374151] font-medium group-hover:text-[#111827]">RankHire</span>
          <ChevronDown size={14} className="text-[#9CA3AF]" />
        </div>
      </div>
    </header>
  );
}
