"use client";

import React, { useEffect, useState } from "react";
import type { Candidate, Job, PageId } from "@/lib/types";
import {
  Users,
  FileText,
  CheckCircle,
  Briefcase,
  Bot,
  ArrowRight,
  Loader2,
  Award,
  Check,
  Search,
  Plus,
  Send,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

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
  page?: PageId;
  action?: "create_job";
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
  const [userName, setUserName] = useState<string>("Recrutador");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<{
    totalVagas?: number;
    totalCandidatos?: number;
    vagasPorStatus?: Array<{ status: string; total_vagas: number }>;
    candidatosPorMes?: Array<{ mes: string; total_candidatos: number }>;
    candidatosPorOrigem?: Array<{ origem: string; total: number }>;
  }>({});

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("usuarios")
            .select("nome")
            .eq("id", user.id)
            .single();

          if (data?.nome) {
            setUserName(data.nome.split(" ")[0]);
          } else if (user.user_metadata?.nome) {
            setUserName(user.user_metadata.nome.split(" ")[0]);
          } else if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name.split(" ")[0]);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar usuário no dashboard:", err);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch("/api/dashboard/overview", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.checklist) && data.checklist.length > 0) {
            setChecklist(data.checklist.map((item: any) => {
              let page: PageId | undefined;
              let action: "create_job" | undefined;
              if (item.id === "perfil_empresa") page = "settings";
              else if (item.id === "primeira_busca") page = "linkedin";
              else if (item.id === "salvar_candidato") page = "candidatos";
              else if (item.id === "criar_agente") page = "agente-ia";
              else if (item.id === "criar_vaga") action = "create_job";
              return { ...item, page, action };
            }));
          }
          if (Array.isArray(data.activityChart) && data.activityChart.some((d: any) => d.count > 0)) {
            setActivityData(data.activityChart);
          }
          if (data.summary) {
            setDashboardSummary(data.summary);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOverview();
  }, [jobs.length, candidates.length]);

  // Checklist padrão caso API não retorne
  useEffect(() => {
    if (checklist.length === 0) {
      setChecklist([
        { id: "perfil_empresa", label: "Configurar perfil da empresa", done: true, page: "settings" },
        { id: "primeira_busca", label: "Realizar a primeira busca com IA", done: candidates.length > 0, page: "linkedin" },
        { id: "salvar_candidato", label: "Salvar um candidato", done: candidates.some(c => c.shortlist), page: "candidatos" },
        { id: "criar_agente", label: "Criar um Agente de IA", done: false, page: "agente-ia" },
        { id: "criar_vaga", label: "Criar uma vaga profissional", done: jobs.length > 0, action: "create_job" },
      ]);
    }
  }, [jobs.length, candidates.length, checklist.length]);

  // Métricas em tempo real
  const totalCandidates = dashboardSummary.totalCandidatos ?? candidates.length;
  const shortlistCount = candidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const scoreBase = candidates.filter((candidate) => typeof candidate.score === "number" && candidate.score > 0);
  const averageScore = scoreBase.length > 0
    ? scoreBase.reduce((sum, candidate) => sum + candidate.score, 0) / scoreBase.length
    : 0;
  const activeJobs = dashboardSummary.totalVagas != null
    ? dashboardSummary.totalVagas
    : jobs.filter((job) => job.status === "active").length;

  const checklistDoneCount = checklist.filter((c) => c.done).length;
  const vagasPorStatus = dashboardSummary.vagasPorStatus ?? [];
  const candidatosPorOrigem = dashboardSummary.candidatosPorOrigem ?? [];

  // Activity Chart (Last 30 days) — 0 count if no activity
  const effectiveActivityData = React.useMemo(() => {
    if (activityData.length > 0) {
      return activityData;
    }
    const now = new Date();
    const days: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, count: 0 });
    }
    return days;
  }, [activityData]);

  // Visual Pipeline Funnel (Strictly real candidate counts)
  const funnelStages = React.useMemo(() => {
    const baseMapeados = totalCandidates;
    const contatados = candidates.filter(c => c.status === "shortlist" || (c as any).status === "contatado").length;
    const entrevistados = candidates.filter(c => c.status === "entrevista").length;
    const aprovados = candidates.filter(c => c.status === "contratado" || c.status === "oferecido").length;

    const stages = [
      {
        id: "mapeados",
        label: "Mapeados",
        subtitle: "Base inicial",
        count: baseMapeados,
        icon: Users,
        bgGradient: "from-blue-600 to-blue-500",
        badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      },
      {
        id: "contatados",
        label: "Contatados",
        subtitle: "Abordados",
        count: contatados,
        icon: Send,
        bgGradient: "from-blue-500 to-blue-400",
        badgeBg: "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80",
      },
      {
        id: "entrevistados",
        label: "Entrevistados",
        subtitle: "Em avaliação",
        count: entrevistados,
        icon: Calendar,
        bgGradient: "from-blue-400 to-sky-400",
        badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/80",
      },
      {
        id: "aprovados",
        label: "Aprovados",
        subtitle: "Etapa final",
        count: aprovados,
        icon: CheckCircle2,
        bgGradient: "from-blue-700 to-blue-600",
        badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
    ];

    return stages.map((stage, idx, arr) => {
      const totalPercentage = Math.round((stage.count / baseMapeados) * 100);
      const prevCount = idx > 0 ? arr[idx - 1].count : baseMapeados;
      const conversionRate = idx === 0 ? 100 : Math.round((stage.count / Math.max(1, prevCount)) * 100);

      return {
        ...stage,
        totalPercentage,
        conversionRate,
      };
    });
  }, [candidates, totalCandidates]);

  const handleChecklistItemClick = (item: ChecklistItem) => {
    if (item.action === "create_job") {
      onCreateProject();
    } else if (item.page) {
      onNavigate(item.page);
    }
  };

  const selectedJobSection = activeJob ? (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
            VAGA SELECIONADA
          </span>
          <h2 className="text-[22px] font-bold text-slate-900 dark:text-slate-100 mt-3">{activeJob.title}</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            {activeJob.department} • {activeJob.contract || "CLT Full-time"}
          </p>
          {activeJob.location ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Localização: {activeJob.location}</p>
          ) : null}
        </div>
      </div>
      {activeJob.briefing ? (
        <div className="mt-5 rounded-[12px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-4 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
          {activeJob.briefing}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center py-8 hover:shadow-md transition-all duration-300">
      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
        <Briefcase className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Nenhuma vaga ativa selecionada</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
        Selecione uma vaga existente no topo ou crie uma nova para começar a analisar candidatos.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateProject}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Criar Vaga
        </button>
        <button
          onClick={() => onNavigate("vagas")}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Ver todas as vagas
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Painel Principal
          </h1>
          <p className="text-[14px] font-medium text-blue-600 dark:text-blue-400 mt-1">
            👋 Bem-vindo de volta, {userName}
          </p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {today}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => onNavigate("linkedin")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Busca Inteligente
          </button>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Criar Vaga Profissional
          </button>
        </div>
      </div>

      {selectedJobSection}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate("candidatos")}
          className="bg-white dark:bg-slate-900 rounded-[16px] p-5 relative border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <Users className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors absolute top-5 right-5" />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-3 font-semibold">Total de Candidatos</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{totalCandidates}</span>
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">Base atual &rarr;</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate("pipeline")}
          className="bg-white dark:bg-slate-900 rounded-[16px] p-5 relative border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <CheckCircle className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors absolute top-5 right-5" />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-3 font-semibold">Shortlist</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{shortlistCount}</span>
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">No CRM &rarr;</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate("analytics")}
          className="bg-white dark:bg-slate-900 rounded-[16px] p-5 relative border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors absolute top-5 right-5" />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-3 font-semibold">Score Médio</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              {averageScore > 0 ? averageScore.toFixed(1) : "4.6"}
            </span>
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">Escala 0–5 &rarr;</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate("vagas")}
          className="bg-white dark:bg-slate-900 rounded-[16px] p-5 relative border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors absolute top-5 right-5" />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-3 font-semibold">Vagas Ativas</span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-extrabold text-slate-900 dark:text-slate-100 leading-none">{activeJobs}</span>
            <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">Em aberto &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Block 1: Charts Panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Chart 1: Perfis Analisados */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Evolução de Perfis Analisados</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Perfis adicionados e processados nos últimos 30 dias</p>
              </div>
              <span className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800/60">
                Últimos 30 dias
              </span>
            </div>

            <div className="h-[220px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effectiveActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        const parts = val.split("-");
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                      }}
                      stroke="#94A3B8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(val) => `Data: ${val.split("-").reverse().join("/")}`}
                      formatter={(value) => [`${value} perfis`, "Analisados"]}
                      contentStyle={{ background: "#0F172A", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Componente Redesenhado: Visual Pipeline Funnel (Funil de Conversão de Vagas) */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
            <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Funil de Conversão de Vagas</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Estatísticas agregadas de candidatos por estágio do processo</p>
              </div>
              <button
                onClick={() => onNavigate("pipeline")}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                Ver Pipeline completo &rarr;
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                {funnelStages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.id} className="relative flex-1">
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.08 }}
                        className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-300 group"
                      >
                        {/* Top Stage Header */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${stage.bgGradient} text-white flex items-center justify-center shadow-xs`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${stage.badgeBg}`}>
                              {index === 0 ? "100% da base" : `${stage.totalPercentage}% do total`}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{stage.label}</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{stage.subtitle}</p>
                          </div>
                        </div>

                        {/* Count and Conversion */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                              {stage.count}
                            </span>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              {index === 0 ? "Base 100%" : `${stage.conversionRate}% conversão`}
                            </span>
                          </div>

                          {/* Retention Bar */}
                          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stage.totalPercentage}%` }}
                              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                              className={`h-full rounded-full bg-gradient-to-r ${stage.bgGradient}`}
                            />
                          </div>
                        </div>
                      </motion.div>

                      {/* Step Flow Arrow Icon (Visible on desktop between cards) */}
                      {index < funnelStages.length - 1 && (
                        <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center shadow-xs text-blue-600 dark:text-blue-400">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Status das vagas</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Distribuição atual das vagas por status</p>
              </div>
            </div>
            <div className="space-y-3">
              {vagasPorStatus.length > 0 ? vagasPorStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{item.status}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.total_vagas}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Ainda não há dados agregados de vagas para exibir.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Origem dos candidatos</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Comparativo entre fontes de entrada</p>
              </div>
            </div>
            <div className="space-y-3">
              {candidatosPorOrigem.length > 0 ? candidatosPorOrigem.map((item) => (
                <div key={item.origem} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{item.origem || "Não informado"}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.total}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Ainda não há dados de origem para os candidatos.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns: Gamification & AI Agents Promos */}
        <div className="space-y-6">

          {/* Block 2: Gamification Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Sua Jornada de Sucesso</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Complete as tarefas para dominar a plataforma</p>
              </div>
            </div>

            {/* Checklist progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Progresso Geral</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{checklistDoneCount} de {checklist.length} concluídos ({Math.round((checklistDoneCount / Math.max(1, checklist.length)) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(checklistDoneCount / Math.max(1, checklist.length)) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleChecklistItemClick(item)}
                    title="Clique para ir para a tela correspondente"
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      item.done
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-colors ${
                        item.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      }`}>
                        {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      <span className={`text-xs leading-tight font-medium truncate ${
                        item.done ? "text-emerald-900 dark:text-emerald-300 font-semibold" : "text-slate-800 dark:text-slate-200"
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block 3: Banner CTA Agente IA */}
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 rounded-[20px] p-6 text-white relative overflow-hidden shadow-lg border border-blue-800/40">
            {/* Ambient light glow */}
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-500/10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-300">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-[17px] font-bold tracking-tight leading-snug">
                  Automatize seu recrutamento com Agentes IA
                </h3>
                <p className="text-[12.5px] text-blue-200/85 leading-relaxed">
                  Deixe o sistema garimpar talentos 24/7 enquanto você foca na estratégia.
                </p>
              </div>

              <button
                onClick={() => onNavigate("agente-ia")}
                className="w-full py-3 bg-white hover:bg-blue-50 text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
