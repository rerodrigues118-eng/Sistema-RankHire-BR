"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import ProfileConfig from "@/components/ProfileConfig";
import CompanySection from "../CompanySection";
import PlanosConfigPage from "@/app/configuracoes/plano/page";

export default function SettingsPage() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <ProfileConfig />
      </div>

      <CompanySection />

      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={16} style={{ color: "#1B4FD8" }} />
          <h2 className="text-sm font-medium text-gray-800">Plano e faturamento</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700">Consulte e gerencie seu plano corporativo.</p>
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Gerenciar Assinatura
          </button>
        </div>
      </div>

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fechar modal de planos"
            >
              <X size={20} />
            </button>
            <PlanosConfigPage />
          </div>
        </div>
      )}
    </div>
  );
}
