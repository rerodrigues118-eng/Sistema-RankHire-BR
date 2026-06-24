"use client";

import React, { useState } from "react";
import { ArrowLeft, Bot, Search, BarChart3, Filter, Check, X, Star } from "lucide-react";

export default function AgenteDetailsPage() {
  const [activeTab, setActiveTab] = useState("candidatos");

  // Mocks de candidatos agrupados
  const candidatosHoje = [
    {
      id: 1,
      nome: "Juliana Mendes",
      cargo: "Senior Email Designer",
      empresa: "TechCorp",
      score: 4.7,
      isNovo: true,
      hora: "08:12",
      criterios: [
        { nome: "Figma", nota: 5.0 },
        { nome: "HTML Email", nota: 4.5 },
      ]
    },
    {
      id: 2,
      nome: "Ricardo Gomes",
      cargo: "UX/UI Designer",
      empresa: "Agência Digital",
      score: 4.2,
      isNovo: true,
      hora: "08:14",
      criterios: [
        { nome: "Figma", nota: 4.0 },
        { nome: "HTML Email", nota: 3.5 },
      ]
    }
  ];

  const candidatosOntem = [
    {
      id: 3,
      nome: "Fernanda Lima",
      cargo: "Email Marketing Analista",
      empresa: "E-commerce XP",
      score: 3.8,
      isNovo: false,
      hora: "08:09",
      criterios: [
        { nome: "Figma", nota: 3.0 },
        { nome: "HTML Email", nota: 4.0 },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Top Navigation */}
      <button 
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-[13px] font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Agentes
      </button>

      {/* Header do Agente */}
      <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB] flex items-center justify-center flex-shrink-0">
            <Bot className="w-8 h-8 text-[#635BFF]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Agente Designer Email</h1>
            <div className="flex items-center gap-2 mt-1 text-[13px] text-[#6B7280]">
              <span>Vaga: Email Designer BR — Figma</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-[#6B7280]">Próxima execução</p>
          <p className="text-[16px] font-bold text-[#111827]">Amanhã, 08:00</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E7EB] px-2">
        <button 
          onClick={() => setActiveTab('candidatos')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors text-[14px] font-semibold ${
            activeTab === 'candidatos' ? 'border-[#06D6A0] text-[#06D6A0]' : 'border-transparent text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <Search className="w-4 h-4" /> Candidatos Descobertos
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors text-[14px] font-semibold ${
            activeTab === 'performance' ? 'border-[#06D6A0] text-[#06D6A0]' : 'border-transparent text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Performance & Métricas
        </button>
      </div>

      {/* Aba de Candidatos */}
      {activeTab === 'candidatos' && (
        <div className="space-y-8">
          
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-bold text-[#111827]">Resultados Recentes</h3>
            <button className="flex items-center gap-2 text-[13px] font-semibold text-[#6B7280] border border-[#D1D5DB] px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6]">
              <Filter className="w-4 h-4" /> Filtrar Score
            </button>
          </div>

          <div className="space-y-6">
            {/* Grupo Hoje */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h4 className="text-[14px] font-bold text-[#111827]">Hoje</h4>
                <div className="h-px flex-1 bg-[#E5E7EB]"></div>
              </div>

              {candidatosHoje.map(cand => (
                <div key={cand.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-start justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#635BFF] to-[#06D6A0] rounded-full flex items-center justify-center text-white font-bold text-[18px]">
                      {cand.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[16px] font-bold text-[#111827]">{cand.nome}</h4>
                        {cand.isNovo && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded">Novo</span>
                        )}
                        <span className="text-[12px] text-[#6B7280]">· Descoberto às {cand.hora}</span>
                      </div>
                      <p className="text-[13px] text-[#374151] mt-0.5">{cand.cargo} na {cand.empresa}</p>
                      
                      <div className="flex gap-2 mt-3">
                        {cand.criterios.map((crit, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-[11px] font-medium text-[#4B5563]">
                            {crit.nome}: <span className="font-bold text-[#111827]">{crit.nota}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#F59E0B] fill-current" />
                      <span className="text-[20px] font-black text-[#111827]">{cand.score}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-red-500 hover:bg-red-50 border border-red-200 rounded transition-colors" title="Rejeitar">
                        <X className="w-4 h-4" />
                      </button>
                      <button className="px-3 py-1.5 bg-[#111827] text-white text-[12px] font-bold rounded hover:bg-[#1F2937] transition-colors">
                        Shortlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grupo Ontem */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h4 className="text-[14px] font-bold text-[#6B7280]">Ontem</h4>
                <div className="h-px flex-1 bg-[#E5E7EB]"></div>
              </div>

              {candidatosOntem.map(cand => (
                <div key={cand.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-start justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-[18px]">
                      {cand.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[16px] font-bold text-[#111827]">{cand.nome}</h4>
                        <span className="text-[12px] text-[#6B7280]">· Descoberto às {cand.hora}</span>
                      </div>
                      <p className="text-[13px] text-[#374151] mt-0.5">{cand.cargo} na {cand.empresa}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-[20px] font-black text-[#111827]">{cand.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Aba de Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gráfico Simulado */}
            <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl shadow-sm">
              <h3 className="text-[15px] font-bold text-[#111827] mb-4">Candidatos Descobertos (30 dias)</h3>
              <div className="h-48 w-full flex items-end justify-between gap-1 mt-4">
                {/* Mock barras */}
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="w-full bg-[#E0E7FF] rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}>
                    <div className="bg-[#635BFF] rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 60)}%` }}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-[#6B7280] mt-2">
                <span>15 dias atrás</span>
                <span>Hoje</span>
              </div>
            </div>

            {/* Funil de Conversão */}
            <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl shadow-sm">
              <h3 className="text-[15px] font-bold text-[#111827] mb-4">Funil de Conversão</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#6B7280]">Perfis Analisados</span>
                    <span className="font-bold text-[#111827]">312</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-2"><div className="bg-gray-400 h-2 rounded-full" style={{width: '100%'}}></div></div>
                </div>
                
                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#6B7280]">Passaram nos Filtros</span>
                    <span className="font-bold text-[#111827]">89</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{width: '60%'}}></div></div>
                </div>

                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#6B7280]">Score 4.0+</span>
                    <span className="font-bold text-[#111827]">23</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-2"><div className="bg-[#06D6A0] h-2 rounded-full" style={{width: '30%'}}></div></div>
                </div>

                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[#6B7280]">Adicionados ao Shortlist</span>
                    <span className="font-bold text-[#111827]">11</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-2"><div className="bg-[#635BFF] h-2 rounded-full" style={{width: '15%'}}></div></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex justify-between items-center">
                <div className="text-[12px] text-[#6B7280]">
                  Taxa de Acerto (Shortlist / Analisados)
                </div>
                <div className="text-[18px] font-black text-[#111827]">3.5%</div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
