"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
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

type ScoreBucket = {
  range: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

type TimeRange = "7d" | "30d" | "year";

function StatCard({
  label,
  value,
  subtext,
  trend,
  accent = "#111827",
}: {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: "0.5px solid #E2E8F0" }}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium" style={{ color: accent }}>
        {value}
      </p>
      <div className="mt-3 flex flex-col gap-1">
        <span className="text-xs text-slate-500">{subtext}</span>
        {trend ? (
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        ) : null}
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "year", label: "Ano atual" },
];

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AnalyticsPage({ jobs, candidates, quota }: AnalyticsPageProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const hasDateData = candidates.some((candidate) => !!candidate.createdAt && parseDate(candidate.createdAt));

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
  }, [selectedRange, now]);

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

  const filteredCandidates = useMemo(() => {
    if (!hasDateData) return candidates;
    return candidates.filter((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      return createdAt ? createdAt >= currentWindowStart && createdAt <= now : false;
    });
  }, [candidates, currentWindowStart, hasDateData, now]);

  const previousCandidates = useMemo(() => {
    if (!hasDateData) return [];
    return candidates.filter((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      if (!createdAt) return false;
      return createdAt >= previousWindowStart && createdAt < currentWindowStart;
    });
  }, [candidates, hasDateData, previousWindowStart, currentWindowStart]);

  const totalCandidates = filteredCandidates.length;
  const totalPrevious = previousCandidates.length;

  const averageScore = filteredCandidates.length > 0
    ? filteredCandidates.reduce((sum, candidate) => sum + candidate.score, 0) / filteredCandidates.length
    : 0;

  const scoreHigh = filteredCandidates.filter((candidate) => candidate.score >= 4.0).length;
  const shortlisted = filteredCandidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const contacted = filteredCandidates.filter((candidate) => ["entrevista", "oferecido", "contratado"].includes(candidate.status)).length;
  const hired = filteredCandidates.filter((candidate) => candidate.status === "contratado").length;

  const scoreDistribution: ScoreBucket[] = [
    { range: "4.5 – 5.0", label: "Excelente", count: filteredCandidates.filter((candidate) => candidate.score >= 4.5).length, percent: 0, color: "#06D6A0" },
    { range: "3.5 – 4.4", label: "Adequado", count: filteredCandidates.filter((candidate) => candidate.score >= 3.5 && candidate.score < 4.5).length, percent: 0, color: "#1B4FD8" },
    { range: "2.5 – 3.4", label: "Parcial", count: filteredCandidates.filter((candidate) => candidate.score >= 2.5 && candidate.score < 3.5).length, percent: 0, color: "#D4AF37" },
    { range: "< 2.5", label: "Baixa aderência", count: filteredCandidates.filter((candidate) => candidate.score > 0 && candidate.score < 2.5).length, percent: 0, color: "#CBD5E1" },
  ].map((item) => ({
    ...item,
    percent: totalCandidates > 0 ? Math.round((item.count / totalCandidates) * 100) : 0,
  }));

  const hireTimes = filteredCandidates
    .filter((candidate) => candidate.status === "contratado")
    .map((candidate) => {
      const createdAt = parseDate(candidate.createdAt);
      return createdAt ? daysBetween(createdAt, now) : null;
    })
    .filter((value): value is number => value !== null);

  const averageTimeToHire = hireTimes.length > 0
    ? Math.round(hireTimes.reduce((sum, value) => sum + value, 0) / hireTimes.length)
    : null;

  const totalJobsActive = jobs.filter((job) => job.status === "active").length;
  const totalJobsPaused = jobs.filter((job) => job.status === "paused").length;

  const analyzedTrend = useMemo(() => {
    if (totalPrevious === 0) {
      return totalCandidates > 0 ? "↑ +100% vs período anterior" : "Sem dados anteriores";
    }
    const diff = totalCandidates - totalPrevious;
    const percent = Math.round((Math.abs(diff) / Math.max(totalPrevious, 1)) * 100);
    return diff >= 0
      ? `↑ +${percent}% vs período anterior`
      : `↓ -${percent}% vs período anterior`;
  }, [totalCandidates, totalPrevious]);

  const usageItems = [
    { label: "Candidatos analisados", value: totalCandidates.toString(), subtext: "Base atual da empresa", accent: "#1B4FD8", trend: analyzedTrend },
    { label: "Média geral de scores", value: `${averageScore > 0 ? averageScore.toFixed(1) : "0.0"}/5.0`, subtext: "Somente candidatos pontuados", accent: "#D4AF37" },
    { label: "Créditos de processamento", value: quota?.limit !== null && quota?.limit !== undefined ? `${quota.used}/${quota.limit}` : `${quota?.used ?? 0}`, subtext: quota?.isAdmin ? "Acesso administrador" : `Plano ${quota?.plano || "sem plano"} · mês ${quota?.mes || "atual"}`, accent: "#111827" },
  ];

  const funnelStages = [
    { label: "Analisados", value: totalCandidates },
    { label: "Score 4.0+", value: scoreHigh },
    { label: "Shortlist", value: shortlisted },
    { label: "Contatados", value: contacted },
    { label: "Contratados", value: hired },
  ];

  const funnelItems = funnelStages.map((item, index) => {
    const previousValue = index === 0 ? totalCandidates : funnelStages[index - 1].value;
    const rate = previousValue > 0 ? Math.round((item.value / previousValue) * 100) : 0;
    return {
      ...item,
      conversionText: index > 0 ? `${rate}% de taxa de avanço` : null,
      barWidth: totalCandidates > 0 ? Math.max(10, Math.round((item.value / totalCandidates) * 100)) : 0,
    };
  });

  const scoreChartData = scoreDistribution.map((item) => ({
    name: item.range,
    value: item.count,
    label: item.label,
    percent: item.percent,
    color: item.color,
  }));

  const handleRangeSelect = (range: TimeRange) => {
    if (range === selectedRange) return;
    setSelectedRange(range);
    setRefreshKey((value) => value + 1);
  };

  const currentPeriodLabel = rangeOptions.find((option) => option.value === selectedRange)?.label ?? "Período atual";

  return (
    <motion.div
      key={refreshKey}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Analytics</p>
          <p className="text-sm text-slate-500">Visualize as métricas estratégicas por período.</p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          <div className="hidden items-center gap-2 md:flex">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRangeSelect(option.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedRange === option.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="w-full md:hidden">
            <label htmlFor="analytics-time-range" className="sr-only">Período</label>
            <select
              id="analytics-time-range"
              value={selectedRange}
              onChange={(event) => handleRangeSelect(event.target.value as TimeRange)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 md:flex">
            {currentPeriodLabel}
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {usageItems.map((item) => (
          <motion.div key={item.label} variants={itemVariants}>
            <StatCard
              label={item.label}
              value={item.value}
              subtext={item.subtext}
              trend={item.trend}
              accent={item.accent}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "#1B4FD8" }} />
              <div>
                <h2 className="text-sm font-medium text-gray-800">Distribuição de candidatos por faixa de score</h2>
                <p className="text-xs text-slate-500">{currentPeriodLabel}</p>
              </div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {totalCandidates} candidatos no período
            </div>
          </div>

          {totalCandidates === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Ainda não existem candidatos suficientes para gerar distribuição.
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChartData} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                    formatter={(value: number, name: string, props: any) => {
                      const data = props.payload[0]?.payload as { percent: number; name: string };
                      return [`${value} candidatos`, `${data?.name}`];
                    }}
                    labelFormatter={(label) => `${label} - ${scoreDistribution.find((item) => item.range === label)?.label ?? ""}`}
                    contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {scoreChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants} className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-sm text-gray-500">Funil</p>
              <p className="text-xs text-slate-400">Taxas de avanço entre etapas</p>
            </div>
            {averageTimeToHire !== null ? (
              <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700">Tempo médio de fechamento: {averageTimeToHire} dias</div>
            ) : (
              <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700">Sem dados de contratação</div>
            )}
          </div>

          <div className="space-y-4">
            {funnelItems.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{item.label}</span>
                    {item.conversionText ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{item.conversionText}</span>
                    ) : null}
                  </div>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.barWidth}%` }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="h-2 rounded-full bg-[#1B4FD8]"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
          <p className="text-sm text-gray-500 mb-1">Resumo operacional</p>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Vagas ativas</span>
              <strong className="text-slate-900">{totalJobsActive}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Vagas pausadas</span>
              <strong className="text-slate-900">{totalJobsPaused}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Candidatos na shortlist</span>
              <strong className="text-slate-900">{shortlisted}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Candidatos acima de 4.0</span>
              <strong className="text-slate-900">{scoreHigh}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Período</span>
              <strong className="text-slate-900">{currentPeriodLabel}</strong>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
