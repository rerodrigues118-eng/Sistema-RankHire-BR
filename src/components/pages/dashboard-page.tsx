"use client";

import React from "react";
import type { Candidate, Job } from "@/lib/types";
import { Users, FileText, CheckCircle, Briefcase, Plus, Clock, Sparkles } from "lucide-react";

interface DashboardPageProps {
  activeJob: Job | null;
  jobs: Job[];
  candidates: Candidate[];
  onToggleShortlist: (id: string) => void;
  onSelectCandidate: (c: Candidate) => void;
  onCreateProject: () => void;
}

type Activity = {
  id: string;
  text: string;
  time: string;
  type: "success" | "info" | "update" | "create";
};

type ActivityWithTs = Activity & { timestamp: number };

function formatDateLabel(date?: string) {
  if (!date) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function DashboardPage({
  activeJob,
  jobs,
  candidates,
  onCreateProject,
}: DashboardPageProps) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const totalCandidates = candidates.length;
  const shortlistCount = candidates.filter((candidate) => candidate.shortlist || candidate.status === "shortlist").length;
  const scoreBase = candidates.filter((candidate) => candidate.score > 0);
  const averageScore = scoreBase.length > 0
    ? scoreBase.reduce((sum, candidate) => sum + candidate.score, 0) / scoreBase.length
    : 0;
  const activeJobs = jobs.filter((job) => job.status === "active").length;

  const recentJobs = jobs.slice(0, 2);

  const selectedJobSection = activeJob ? (
    <div className="bg-white rounded-[12px] p-6 border border-[#E5E7EB] mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide">Vaga selecionada</span>
          <h2 className="text-[20px] font-semibold text-[#111827] mt-2">{activeJob.title}</h2>
          <p className="text-[13px] text-[#6B7280] mt-2">
            {activeJob.department} • {activeJob.contract || "Contrato não informado"}
          </p>
          {activeJob.location ? (
            <p className="text-[13px] text-[#6B7280] mt-1">Localização: {activeJob.location}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span className="inline-flex items-center rounded-full bg-[#ECFDF5] px-3 py-1 text-[11px] font-semibold text-[#047857]">
            {activeJob.status === "active" ? "Ativa" : activeJob.status === "paused" ? "Em pausa" : "Encerrada"}
          </span>
          <span className="text-[12px] text-[#6B7280]">Criada em {activeJob.createdDate}</span>
        </div>
      </div>
      {activeJob.briefing ? (
        <div className="mt-5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-[13px] text-[#334155]">
          {activeJob.briefing}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="bg-white rounded-[12px] p-6 border border-[#E5E7EB] mb-8">
      <span className="text-[12px] text-[#6B7280] uppercase tracking-wide">Vaga selecionada</span>
      <p className="mt-4 text-[15px] text-[#374151] font-medium">Nenhuma vaga selecionada — vá em Vagas e selecione uma</p>
    </div>
  );

  const recentActivities: ActivityWithTs[] = [
    ...jobs
      .filter((job) => job.createdAt)
      .map((job) => ({
        id: `job-${job.id}`,
        text: `Vaga ${job.title} criada`,
        time: formatDateLabel(job.createdAt),
        type: "create" as const,
        timestamp: new Date(job.createdAt as string).getTime(),
      })),
    ...candidates
      .filter((candidate) => candidate.createdAt)
      .map((candidate) => ({
        id: `cand-${candidate.id}`,
        text: `${candidate.name} recebeu score ${candidate.score.toFixed(1)}`,
        time: formatDateLabel(candidate.createdAt),
        type: candidate.shortlist ? ("update" as const) : ("info" as const),
        timestamp: new Date(candidate.createdAt as string).getTime(),
      })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[24px] font-semibold text-[#111827] tracking-tight">
          Painel principal
        </h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          {today}
        </p>
      </div>

      {selectedJobSection}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] rounded-[12px] p-5 relative" style={{ border: "1px solid #E5E7EB" }}>
          <Users className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3">Total de Candidatos</span>
          <div className="flex items-end gap-3">
            <span className="text-[28px] font-bold text-[#111827] leading-none">{totalCandidates}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Base atual</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[12px] p-5 relative" style={{ border: "1px solid #E5E7EB" }}>
          <CheckCircle className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3">Shortlist</span>
          <div className="flex items-end gap-3">
            <span className="text-[28px] font-bold text-[#111827] leading-none">{shortlistCount}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Candidatos marcados</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[12px] p-5 relative" style={{ border: "1px solid #E5E7EB" }}>
          <FileText className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3">Score Médio</span>
          <div className="flex items-end gap-3">
            <span className="text-[28px] font-bold text-[#111827] leading-none">
              {averageScore > 0 ? averageScore.toFixed(1) : "0.0"}
            </span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Escala 0–5</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-[12px] p-5 relative" style={{ border: "1px solid #E5E7EB" }}>
          <Briefcase className="w-5 h-5 text-[#9CA3AF] absolute top-5 right-5" />
          <span className="text-[12px] text-[#6B7280] uppercase tracking-wide block mb-3">Vagas Ativas</span>
          <div className="flex items-end gap-3">
            <span className="text-[28px] font-bold text-[#111827] leading-none">{activeJobs}</span>
            <span className="text-[12px] font-medium text-[#6B7280] mb-1">Operando agora</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#111827]">Vagas recentes</h2>
            <button className="text-[13px] text-[#06D6A0] font-medium hover:underline">Ver todas</button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-dashed border-[#D1D5DB] min-h-[220px] flex flex-col items-center justify-center text-center px-6">
              <Briefcase className="w-10 h-10 text-[#9CA3AF] mb-3" />
              <h3 className="text-[15px] font-semibold text-[#111827]">Nenhuma vaga encontrada</h3>
              <p className="text-[13px] text-[#6B7280] mt-1 max-w-sm">
                Crie a primeira vaga para começar a acompanhar candidatos, scores e pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#FFFFFF] p-5 rounded-[12px] flex flex-col justify-between"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase size={16} className="text-[#9CA3AF]" />
                      <span className="text-[12px] text-[#6B7280] uppercase tracking-wider">
                        {job.department || "Geral"}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#111827] mb-1">{job.title}</h3>
                    <p className="text-[13px] text-[#6B7280]">Criada em {job.createdDate}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                      <Users size={14} /> {job.candidatesCount}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                      <Sparkles size={14} /> {job.averageScore.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                      <FileText size={14} /> {job.topScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={onCreateProject}
                className="bg-[#FAFAFA] p-5 rounded-[12px] border border-dashed border-[#D1D5DB] flex flex-col items-center justify-center text-center h-[160px]"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mb-3 shadow-sm">
                  <Plus size={16} />
                </div>
                <h3 className="text-[14px] font-medium text-[#111827] mb-1">Criar projeto</h3>
                <p className="text-[12px] text-[#6B7280] px-4">Inicie uma nova busca de talentos</p>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="text-[16px] font-semibold text-[#111827] mb-4">Atividade recente</h2>
          <div className="bg-white rounded-[12px] p-6" style={{ border: "1px solid #E5E7EB" }}>
            {recentActivities.length === 0 ? (
              <div className="min-h-[220px] flex flex-col items-center justify-center text-center text-[#9CA3AF] text-[13px]">
                <Clock className="w-10 h-10 mb-3" />
                Sem atividades recentes para esta empresa.
              </div>
            ) : (
              <div className="relative border-l border-[#E5E7EB] ml-2 space-y-7">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="relative pl-6">
                    <span
                      className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white ${
                        activity.type === "create"
                          ? "bg-[#06D6A0]"
                          : activity.type === "update"
                            ? "bg-[#D4AF37]"
                            : "bg-[#D1D5DB]"
                      }`}
                    />
                    <p className="text-[13px] text-[#374151] leading-snug">{activity.text}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
