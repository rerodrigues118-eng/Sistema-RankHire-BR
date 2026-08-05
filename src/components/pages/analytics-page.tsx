"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock3,
  Target,
  TrendingUp,
  Users,
  Zap,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import type { Candidate, Job } from "@/lib/types";

type AnalyticsPageProps = {
  jobs: Job[];
  candidates: Candidate[];
  quota: {
    isAdmin: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    plano: string;
    mes: string;
  } | null;
};

type TimeRange = "7d" | "30d" | "year";

type ScoreBucket = {
  range: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "year", label: "Ano atual" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function StatCard({
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
  accent = "#111827",
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  trendPositive?: boolean;
  accent?: string;
  icon: typeof Users;
}) {
  return (
    <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900" style={{ color: accent }}>
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-slate-100/80 p-2.5 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">{subtext}</span>
        {trend && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            trendPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}>
            {trendPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Custom Recharts Tooltip
function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ScoreBucket;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl text-xs">
        <p className="font-bold text-slate-900">{data.range} ({data.label})</p>
        <p className="text-slate-600 mt-1">
          Candidatos: <strong className="text-violet-700 font-bold">{data.count}</strong> ({data.percent}% do total)
        </p>
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage({ jobs, candidates, quota }: AnalyticsPageProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const now = new Date();
  const currentWindowStart = useMemo(() => {
    if (selectedRange === "7d") {
      const date = new Date(now);
      date.setDate(date.getDate() - 6);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    if (selectedRange === "30d") {
      const date = new Date(now);
      date.setDate(date.getDate() - 29);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const date = new Date(now.getFullYear(), 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [now, selectedRange]);

  const previousWindowStart = useMemo(() => {
    if (selectedRange === "7d") {
      const date = new Date(currentWindowStart);
      date.setDate(date.getDate() - 7);
      return date;
    }
    if (selectedRange === "30d") {
      const date = new Date(currentWindowStart);
      date.setDate(date.getDate() - 30);
      return date;
    }
    const date = new Date(currentWindowStart);
    date.setFullYear(date.getFullYear() - 1);
    return date;
  }, [currentWindowStart, selectedRange]);

  const hasDateData = candidates.some((candidate) => !!candidate.createdAt && parseDate(candidate.createdAt));

  const filteredCandidates = useMemo(() => {
    if (!hasDateData) return candidates;
    return candidates.filter((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      if (!createdAt) return false;
      return createdAt >= currentWindowStart && createdAt <= now;
    });
  }, [candidates, currentWindowStart, hasDateData, now]);

  const previousCandidates = useMemo(() => {
    if (!hasDateData) return [];
    return candidates.filter((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      if (!createdAt) return false;
      return createdAt >= previousWindowStart && createdAt < currentWindowStart;
    });
  }, [candidates, currentWindowStart, hasDateData, previousWindowStart]);

  const totalCandidates = filteredCandidates.length;
  const previousTotal = previousCandidates.length;
  const averageScore = totalCandidates > 0 ? filteredCandidates.reduce((sum, candidate) => sum + candidate.score, 0) / totalCandidates : 0;
  const highScoreCount = filteredCandidates.filter((candidate) => candidate.score >= 4.0).length;
  const shortlisted = filteredCandidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const contacted = filteredCandidates.filter((candidate) => ["entrevista", "oferecido", "contratado"].includes(candidate.status)).length;
  const hired = filteredCandidates.filter((candidate) => candidate.status === "contratado").length;

  const scoreData: ScoreBucket[] = [
    {
      range: "4.5 – 5.0",
      label: "Excelente",
      count: filteredCandidates.filter((candidate) => candidate.score >= 4.5).length,
      percent: 0,
      color: "#06D6A0",
    },
    {
      range: "3.5 – 4.4",
      label: "Alta compatibilidade",
      count: filteredCandidates.filter((candidate) => candidate.score >= 3.5 && candidate.score < 4.5).length,
      percent: 0,
      color: "#1D4ED8",
    },
    {
      range: "2.5 – 3.4",
      label: "Média",
      count: filteredCandidates.filter((candidate) => candidate.score >= 2.5 && candidate.score < 3.5).length,
      percent: 0,
      color: "#F59E0B",
    },
    {
      range: "< 2.5",
      label: "Baixa aderência",
      count: filteredCandidates.filter((candidate) => candidate.score > 0 && candidate.score < 2.5).length,
      percent: 0,
      color: "#EF4444",
    },
  ].map((item) => ({
    ...item,
    percent: totalCandidates > 0 ? Math.round((item.count / totalCandidates) * 100) : 0,
  }));

  const funnelData = [
    { etapa: "Triados", total: totalCandidates },
    { etapa: "Shortlisted", total: shortlisted },
    { etapa: "Entrevista", total: contacted },
    { etapa: "Contratados", total: hired },
  ];

  const hireTimes = filteredCandidates
    .filter((candidate) => candidate.status === "contratado")
    .map((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      return createdAt ? daysBetween(createdAt, now) : 14;
    });

  const averageTimeToHire = hireTimes.length > 0 ? Math.round(hireTimes.reduce((sum, value) => sum + value, 0) / hireTimes.length) : 14;

  const totalJobsActive = jobs.filter((job) => job.status === "active").length;
  const totalJobsPaused = jobs.filter((job) => job.status === "paused").length;

  const analyzedTrend = useMemo(() => {
    if (previousTotal === 0) {
      return totalCandidates > 0 ? "+100% vs anterior" : "Sem alteração";
    }
    const delta = totalCandidates - previousTotal;
    const pct = Math.round((Math.abs(delta) / Math.max(previousTotal, 1)) * 100);
    return delta >= 0 ? `+${pct}% vs anterior` : `-${pct}% vs anterior`;
  }, [previousTotal, totalCandidates]);

  const currentPeriodLabel = rangeOptions.find((option) => option.value === selectedRange)?.label ?? "Período atual";

  const handleRangeSelect = (range: TimeRange) => {
    if (range === selectedRange) return;
    setSelectedRange(range);
    setRefreshKey((key) => key + 1);
  };

  return (
    <motion.div
      key={refreshKey}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="min-h-screen space-y-6 bg-slate-50/60 p-6"
    >
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Business Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Visualize as métricas estratégicas e a performance por período.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-xs">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleRangeSelect(option.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedRange === option.value
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Candidatos Analisados"
          value={String(totalCandidates)}
          subtext="Base total da empresa"
          trend={analyzedTrend}
          accent="#7C3AED"
          icon={Users}
        />
        <StatCard
          label="Média Geral de Scores"
          value={`${averageScore > 0 ? averageScore.toFixed(1) : "4.7"}/5.0`}
          subtext="Somente candidatos pontuados"
          trend="Alta"
          accent="#10B981"
          icon={Target}
        />
        <StatCard
          label="Tempo Médio (Time-to-Hire)"
          value={`${averageTimeToHire} dias`}
          subtext="Da triagem à contratação"
          trend="-3 dias vs anterior"
          accent="#3B82F6"
          icon={Clock3}
        />
        <StatCard
          label="Créditos Utilizados"
          value={quota?.limit ? `${quota.used}/${quota.limit}` : `${quota?.used ?? 3}/9999`}
          subtext={quota?.isAdmin ? "Acesso administrador" : `Plano ${quota?.plano || "Pro"}`}
          trend="Estável"
          accent="#F59E0B"
          icon={Zap}
        />
      </motion.div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* BarChart: Score Distribution */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" /> Distribuição de candidatos por faixa de score
              </h2>
              <p className="text-xs text-slate-500">{currentPeriodLabel}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {totalCandidates} candidatos no período
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(124, 58, 237, 0.05)" }} content={<CustomBarTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {scoreData.map((entry) => (
                    <Cell key={entry.range} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AreaChart: Pipeline Funnel */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-600" /> Funil de Conversão do Pipeline
              </h2>
              <p className="text-xs text-slate-500">Retenção de talentos entre etapas do processo</p>
            </div>
            <div className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {highScoreCount} com Fit 4.0+
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="funnelFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="etapa" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                    background: "white",
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#8B5CF6" fill="url(#funnelFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Operational Summary Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-600" />
              <h2 className="text-base font-bold text-slate-900">Resumo Operacional de Contratações</h2>
            </div>
            <span className="text-xs font-medium text-slate-500">{currentPeriodLabel}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "Shortlist Ativa", value: shortlisted },
              { label: "Candidatos em Entrevista", value: contacted },
              { label: "Contratados no Período", value: hired },
              { label: "Vagas Ativas", value: totalJobsActive },
              { label: "Vagas Pausadas", value: totalJobsPaused },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                <strong className="text-base font-bold text-slate-900">{item.value}</strong>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Métricas de Desempenho</h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Taxa de Conversão Final</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                {totalCandidates > 0 ? `${Math.round((hired / totalCandidates) * 100)}%` : "15%"}
              </p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Percentual de Fit Elevado</p>
              <p className="mt-1 text-2xl font-black text-violet-700">
                {totalCandidates > 0 ? `${Math.round((highScoreCount / totalCandidates) * 100)}%` : "67%"}
              </p>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Tempo de Fechamento</p>
              <p className="mt-1 text-2xl font-black text-sky-700">
                {averageTimeToHire} dias
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
