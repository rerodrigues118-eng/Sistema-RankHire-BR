"use client";

import { Sparkles, TrendingUp } from "lucide-react";
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

function StatCard({
  label,
  value,
  subtext,
  accent = "#111827",
}: {
  label: string;
  value: string;
  subtext: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium" style={{ color: accent }}>
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <TrendingUp size={14} className="text-emerald-500" />
        <span className="text-xs text-slate-500">{subtext}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage({ jobs, candidates, quota }: AnalyticsPageProps) {
  const scoredCandidates = candidates.filter((candidate) => candidate.score > 0);
  const totalCandidates = candidates.length;
  const averageScore = scoredCandidates.length > 0
    ? scoredCandidates.reduce((sum, candidate) => sum + candidate.score, 0) / scoredCandidates.length
    : 0;
  const scoreHigh = candidates.filter((candidate) => candidate.score >= 4.0).length;
  const shortlisted = candidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const contacted = candidates.filter((candidate) => ["entrevista", "oferecido", "contratado"].includes(candidate.status)).length;
  const hired = candidates.filter((candidate) => candidate.status === "contratado").length;

  const scoreDistribution: ScoreBucket[] = [
    { range: "4.5 – 5.0", label: "Excelente", count: candidates.filter((candidate) => candidate.score >= 4.5).length, percent: 0, color: "#06D6A0" },
    { range: "3.5 – 4.4", label: "Adequado", count: candidates.filter((candidate) => candidate.score >= 3.5 && candidate.score < 4.5).length, percent: 0, color: "#1B4FD8" },
    { range: "2.5 – 3.4", label: "Parcial", count: candidates.filter((candidate) => candidate.score >= 2.5 && candidate.score < 3.5).length, percent: 0, color: "#D4AF37" },
    { range: "< 2.5", label: "Baixa aderência", count: candidates.filter((candidate) => candidate.score > 0 && candidate.score < 2.5).length, percent: 0, color: "#CBD5E1" },
  ].map((item) => ({
    ...item,
    percent: totalCandidates > 0 ? Math.round((item.count / totalCandidates) * 100) : 0,
  }));

  const usageItems = [
    { label: "Candidatos analisados", value: totalCandidates.toString() },
    { label: "Vagas ativas", value: jobs.filter((job) => job.status === "active").length.toString() },
    { label: "Score 4.0+", value: scoreHigh.toString() },
    { label: "Shortlist", value: shortlisted.toString() },
  ];

  const totalUsed = quota?.limit !== null && quota?.limit !== undefined
    ? `${quota.used}/${quota.limit}`
    : `${quota?.used ?? 0}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total analisado"
          value={totalCandidates.toString()}
          subtext="Base atual da empresa"
          accent="#1B4FD8"
        />
        <StatCard
          label="Média geral de scores"
          value={`${averageScore > 0 ? averageScore.toFixed(1) : "0.0"}/5.0`}
          subtext="Somente candidatos pontuados"
          accent="#D4AF37"
        />
        <div className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
          <p className="text-sm text-gray-500 mb-1">Créditos de processamento</p>
          <p className="text-2xl font-medium text-gray-700">
            {totalUsed}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {quota?.isAdmin ? "Acesso administrador" : `Plano ${quota?.plano || "sem plano"} · mês ${quota?.mes || "atual"}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6" style={{ border: "0.5px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={16} style={{ color: "#1B4FD8" }} />
          <h2 className="text-sm font-medium text-gray-800">
            Distribuição de candidatos por faixa de score
          </h2>
        </div>

        {totalCandidates === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Ainda não existem candidatos suficientes para gerar distribuição.
          </div>
        ) : (
          <div className="space-y-4">
            {scoreDistribution.map((item) => (
              <div key={item.range}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{item.range}</span>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.count} candidatos ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-[3px] bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl" style={{ border: "0.5px solid #E2E8F0" }}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {usageItems.map((item, i) => (
            <div
              key={item.label}
              className={`p-5 ${i < usageItems.length - 1 ? "border-r border-gray-100" : ""}`}
            >
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-lg font-medium text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
          <p className="text-sm text-gray-500 mb-1">Funil</p>
          <div className="space-y-3 mt-4">
            {[
              { label: "Analisados", value: totalCandidates },
              { label: "Filtros aplicados", value: totalCandidates },
              { label: "Score 4.0+", value: scoreHigh },
              { label: "Shortlist", value: shortlisted },
              { label: "Contatados", value: contacted },
              { label: "Contratados", value: hired },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-slate-500">{item.label}</span>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[#1B4FD8]"
                    style={{ width: totalCandidates > 0 ? `${Math.max(8, Math.round((item.value / Math.max(totalCandidates, 1)) * 100))}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "0.5px solid #E2E8F0" }}>
          <p className="text-sm text-gray-500 mb-1">Resumo operacional</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Vagas ativas</span>
              <strong className="text-slate-900">{jobs.filter((job) => job.status === "active").length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Vagas pausadas</span>
              <strong className="text-slate-900">{jobs.filter((job) => job.status === "paused").length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Candidatos na shortlist</span>
              <strong className="text-slate-900">{shortlisted}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Candidatos acima de 4.0</span>
              <strong className="text-slate-900">{scoreHigh}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
