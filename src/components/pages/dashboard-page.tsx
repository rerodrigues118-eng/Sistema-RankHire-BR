"use client";

import React, { useEffect, useState } from "react";
import type { Candidate, Job, PageId } from "@/lib/types";
import { Users, FileText, CheckCircle, Briefcase, Sparkles, Bot, ArrowRight, Loader2, Award, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface DashboardPageProps {
  activeJob: Job | null;
  jobs: Job[];
  candidates: Candidate[];
  onToggleShortlist: (id: string) => void;
  onSelectCandidate: (c: Candidate) => void;
  onCreateProject: () => void;
  onNavigate: (page: PageId) => void;
}

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export default function DashboardPage({
  activeJob,
  jobs,
  candidates,
  onCreateProject,
  onNavigate,
}: DashboardPageProps) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistDone, setChecklistDone] = useState(0);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch("/api/dashboard/overview", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setChecklist(data.checklist || []);
          setChecklistDone(data.checklistDone || 0);
          setActivityData(data.activityChart || []);
          setFunnelData(data.funnel || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOverview();
  }, [jobs, candidates]);

  // Keep existing metrics
  const totalCandidates = candidates.length;
  const shortlistCount = candidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const scoreBase = candidates.filter((candidate) => candidate.score > 0);
  const averageScore = scoreBase.length > 0
    ? scoreBase.reduce((sum, candidate) => sum + candidate.score, 0) / scoreBase.length
    : 0;
  const activeJobs = jobs.filter((job) => job.status === "active").length;

  const selectedJobSection = activeJob ? (
    <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Vaga selecionada
          </span>
          <h2 className="text-[22px] font-bold text-gray-900 mt-3">{activeJob.title}</h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            {activeJob.department} • {activeJob.contract || "Contrato não informado"}
          </p>
          {activeJob.location ? (
            <p className="text-[13px] text-[#6B7280] mt-0.5">Localização: {activeJob.location}</p>
          ) : null}
        </div>
        <div className="flex flex-col sm:items-end gap-1.5 sm:text-right">
          <span className="inline-flex items-center rounded-full bg-[#ECFDF5] px-3.5 py-1 text-[11px] font-semibold text-[#047857]">
            {activeJob.status === "active" ? "Ativa" : activeJob.status === "paused" ? "Em pausa" : "Encerrada"}
          </span>
          <span className="text-[12px] text-[#9CA3AF]">Criada em {activeJob.createdDate}</span>
        </div>
      </div>
      {activeJob.briefing ? (
        <div className="mt-5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-[13px] text-gray-600 leading-relaxed">
          {activeJob.briefing}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] flex flex-col items-center justify-center text-center py-10 hover:shadow-md transition-all duration-300">
      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-3">
        <Briefcase className="w-6 h-6" />
      </div>
      <h3 className="text-[16px] font-bold text-gray-950">Nenhuma vaga ativa selecionada</h3>
      <p className="text-[13px] text-gray-500 max-w-sm mt-1 mb-4">
        Selecione uma vaga existente ou crie uma nova para começar a analisar talentos.
      </p>
      <button
        onClick={() => onNavigate("vagas")}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
      >
        Ir para Vagas
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">
            Painel principal
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {today}
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 shrink-0 self-start sm:self-auto"
        >
          Criar vaga profissional
        </button>
      </div>

      {selectedJobSection}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] rounded-[16px] p-5 relative border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
          <Users className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3 font-semibold">Total de Candidatos</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-gray-950 leading-none">{totalCandidates}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Base atual</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[16px] p-5 relative border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
          <CheckCircle className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3 font-semibold">Shortlist</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-gray-950 leading-none">{shortlistCount}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Indicados</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[16px] p-5 relative border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
          <FileText className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3 font-semibold">Score Médio</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-gray-950 leading-none">
              {averageScore > 0 ? averageScore.toFixed(1) : "0.0"}
            </span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Escala 0–5</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[16px] p-5 relative border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
          <Briefcase className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3 font-semibold">Vagas Ativas</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-gray-950 leading-none">{activeJobs}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Em aberto</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Block 1: Charts Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart 1: Perfis Analisados */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-[16px] font-bold text-gray-950">Evolução de Perfis Analisados</h2>
              <p className="text-[12px] text-[#6B7280]">Perfis adicionados e processados nos últimos 30 dias</p>
            </div>
            <div className="h-[220px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : activityData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  Nenhuma atividade registrada nos últimos 30 dias.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        const [, m, d] = val.split("-");
                        return `${d}/${m}`;
                      }}
                      stroke="#9CA3AF"
                      fontSize={11}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(val) => `Data: ${val.split("-").reverse().join("/")}`}
                      formatter={(value) => [`${value} perfis`, "Analisados"]}
                      contentStyle={{ background: "#1F2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Funil de Conversão */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-[16px] font-bold text-gray-950">Funil de Conversão de Vagas</h2>
              <p className="text-[12px] text-[#6B7280]">Estatísticas agregadas de candidatos por estágio do processo</p>
            </div>
            <div className="h-[220px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : funnelData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  Sem candidatos para exibir no funil de conversão.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="stage" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`${value} candidatos`, "Total"]}
                      contentStyle={{ background: "#1F2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorFunnel)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns: Gamification & AI Agents Promos */}
        <div className="space-y-6">
          
          {/* Block 2: Gamification Widget */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E5E7EB] hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-gray-950">Sua jornada de sucesso</h2>
                <p className="text-[12px] text-gray-400">Complete as tarefas para dominar a plataforma</p>
              </div>
            </div>

            {/* Checklist progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1.5">
                <span>Progresso Geral</span>
                <span>{checklistDone} de 5 concluídos ({Math.round((checklistDone / 5) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(checklistDone / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      item.done
                        ? "bg-emerald-50/30 border-emerald-100"
                        : "bg-gray-50/50 border-gray-100"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border mt-0.5 transition-colors ${
                      item.done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-gray-300"
                    }`}>
                      {item.done && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-[13px] leading-tight font-medium ${
                      item.done ? "text-emerald-800 line-through decoration-emerald-200" : "text-gray-700"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block 3: Banner de Ação Rápida */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[20px] p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-900/10">
            {/* Ambient light glow */}
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-500/10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-300">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[17px] font-bold tracking-tight leading-snug">
                  Automatize seu recrutamento com Agentes IA
                </h3>
                <p className="text-[12.5px] text-indigo-200/85 leading-relaxed">
                  Deixe o sistema garimpar talentos 24/7 enquanto você foca na estratégia.
                </p>
              </div>

              <button
                onClick={() => onNavigate("agente-ia")}
                className="w-full py-3 bg-white hover:bg-indigo-50 text-indigo-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                Criar seu primeiro agente <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
