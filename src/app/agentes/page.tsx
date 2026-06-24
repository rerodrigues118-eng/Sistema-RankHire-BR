"use client";

import React, { useState } from "react";
import { Bot, Calendar, Target, Plus, Settings, TrendingUp, CheckCircle, Search, ArrowRight } from "lucide-react";
import AgenteCalibrationModal from "@/components/AgenteCalibrationModal";
import { useRouter } from "next/navigation";

export default function AgentesIAPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Mocks para visualização inicial
  const agentes = [
    {
      id: "1",
      nome: "Agente Designer Email",
      vaga: "Email Designer BR — Figma",
      status: "ativo",
      ultima_busca: "Hoje às 08:00",
      proxima_busca: "Amanhã às 08:00",
      stats: {
        analisados: 47,
        encontrados: 8,
        scoreAlto: 3,
        shortlist: 1
      }
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#635BFF]" /> Agentes IA
          </h2>
          <p className="text-[#6B7280] text-[14px] mt-1">
            Recrutadores virtuais autônomos que buscam talentos 24/7 com base nos seus critérios.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Novo Agente
        </button>
      </div>

      {/* Lista de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentes.map((agente) => (
          <div key={agente.id} className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E5E7EB] flex items-start justify-between bg-[#F9FAFB]">
              <div>
                <h3 className="text-[16px] font-bold text-[#111827] flex items-center gap-2">
                  🤖 {agente.nome}
                </h3>
                <p className="text-[13px] text-[#6B7280] mt-1 line-clamp-1">Vaga: {agente.vaga}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1.5 ${agente.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {agente.status === 'ativo' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                {agente.status}
              </span>
            </div>

            <div className="p-5 flex-1 space-y-6">
              <div className="flex items-center justify-between text-[13px] text-[#374151]">
                <div className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-[#6B7280]" />
                  <span>Última busca:</span>
                </div>
                <span className="font-medium">{agente.ultima_busca}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#374151]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span>Próxima busca:</span>
                </div>
                <span className="font-medium">{agente.proxima_busca}</span>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <p className="text-[13px] font-bold text-[#111827] mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#635BFF]" /> Esta semana:
                </p>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Perfis analisados</span>
                    <span className="font-bold text-[#111827]">{agente.stats.analisados}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Candidatos encontrados</span>
                    <span className="font-bold text-[#111827]">{agente.stats.encontrados}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Com score 4.0+</span>
                    <span className="font-bold text-[#059669]">{agente.stats.scoreAlto}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Adicionados ao pipeline</span>
                    <span className="font-bold text-[#111827]">{agente.stats.shortlist}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] grid grid-cols-3 gap-2">
              <button 
                onClick={() => router.push(`/agentes/${agente.id}`)}
                className="col-span-1 py-1.5 text-center text-[12px] font-semibold text-[#111827] hover:bg-[#E5E7EB] rounded transition-colors"
              >
                Ver candidatos
              </button>
              <button 
                className="col-span-1 py-1.5 text-center text-[12px] font-semibold text-[#111827] hover:bg-[#E5E7EB] rounded transition-colors"
              >
                Calibrar
              </button>
              <button 
                className="col-span-1 py-1.5 text-center text-[12px] font-semibold text-[#111827] hover:bg-[#E5E7EB] rounded transition-colors flex items-center justify-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> Configurar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {agentes.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-[#D1D5DB] rounded-xl bg-[#F9FAFB]">
          <Bot className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-[18px] font-bold text-[#111827]">Nenhum Agente IA ativo</h3>
          <p className="text-[14px] text-[#6B7280] max-w-md mx-auto mt-2">
            Crie seu primeiro recrutador virtual para automatizar a busca por talentos enquanto você não está no sistema.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 px-6 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg text-[14px] font-bold transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Agente
          </button>
        </div>
      )}

      {/* Modal de Criação (Placeholder simplificado) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h3 className="text-[18px] font-bold text-[#111827]">Novo Agente IA</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Nome do agente</label>
                <input type="text" placeholder="Ex: Agente Designer Email" className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Vaga vinculada</label>
                <select className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]">
                  <option>Selecione uma vaga ativa...</option>
                  <option>Email Designer BR — Figma</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Briefing (descreva o candidato ideal)</label>
                <textarea rows={4} placeholder="Procuro alguém com..." className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Frequência de busca</label>
                  <select className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]">
                    <option>Diária (08h)</option>
                    <option>Semanal (Segundas)</option>
                    <option>Apenas Manual</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Notificar se score for</label>
                  <select className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]">
                    <option>Qualquer score</option>
                    <option>3.5 ou acima</option>
                    <option selected>4.0 ou acima (Padrão)</option>
                    <option>Apenas 4.5 ou acima</option>
                  </select>
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] rounded-lg text-[13px] font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsCalibrating(true);
                }}
                className="px-4 py-2 bg-[#635BFF] hover:bg-[#544ee0] text-white rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2"
              >
                Criar e Calibrar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calibração Simulada */}
      {isCalibrating && (
         <AgenteCalibrationModal 
           agenteName="Agente Designer Email" 
           onClose={() => setIsCalibrating(false)} 
           onComplete={() => {
             setIsCalibrating(false);
             setFeedback("Calibração concluída. Agente ativado com sucesso.");
           }} 
         />
      )}

    </div>
  );
}
