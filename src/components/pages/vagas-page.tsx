"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreHorizontal, Briefcase, Users, Star, CheckCircle2, X, Loader2, ChevronLeft, MapPin, Building, FileText, Sparkles, CalendarDays, Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Job, JobStatus } from "@/lib/types";

type FilterStatus = "Todas" | "Ativas" | "Em pausa" | "Encerradas";

interface VagasPageProps {
  jobs: Job[];
  selectedJobId: string | null;
  isActive: boolean;
  isCreateModalOpen: boolean;
  onCreateModalOpened: () => void;
  onCreateJob: (job: Job) => void | Promise<void>;
  onUpdateJob: (job: Job) => void | Promise<void>;
  onOpenJob: (jobId: string) => void;
  onSelectJob: (jobId: string | null) => void;
  onChangeJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
}

type JobDraft = {
  title: string;
  area: string;
  contract: string;
  location: string;
  briefing: string;
  autoAi: boolean;
  status: JobStatus;
};

const DEFAULT_DRAFT: JobDraft = {
  title: "",
  area: "Tecnologia",
  contract: "CLT",
  location: "",
  briefing: "",
  autoAi: true,
  status: "active",
};

export default function VagasPage({
  jobs,
  selectedJobId,
  isActive,
  isCreateModalOpen,
  onCreateModalOpened,
  onCreateJob,
  onUpdateJob,
  onOpenJob,
  onSelectJob,
  onChangeJobStatus,
  onDeleteJob,
}: VagasPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState<JobDraft>(DEFAULT_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [openMenuJobId, setOpenMenuJobId] = useState<string | null>(null);
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<string | null>(null);
  const [modalDeleting, setModalDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiData, setKpiData] = useState<{
    candidatos: number;
    score: number | null;
    shortlist: number;
    entrevistas: number;
    oferecidos: number;
    contratados: number;
    diasAbertos: number;
  } | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<number | null>(null);

  const viewingJob = jobs.find((j) => j.id === viewingJobId);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "Todas"
        ? true
        : filter === "Ativas"
          ? job.status === "active"
          : filter === "Em pausa"
            ? job.status === "paused"
            : filter === "Encerradas"
              ? job.status === "completed"
              : false;
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (jobToEdit?: Job) => {
    if (jobToEdit) {
      setEditingJobId(jobToEdit.id);
      setNewJob({
        title: jobToEdit.title,
        area: jobToEdit.department || "Tecnologia",
        contract: jobToEdit.contract || "CLT",
        location: jobToEdit.location || "",
        briefing: jobToEdit.briefing || "",
        autoAi: jobToEdit.autoAi ?? true,
        status: jobToEdit.status || "active",
      });
    } else {
      setEditingJobId(null);
      setNewJob(DEFAULT_DRAFT);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isCreateModalOpen) {
      handleOpenModal();
      onCreateModalOpened();
    }
  }, [isCreateModalOpen, onCreateModalOpened]);

  useEffect(() => {
        if (!openMenuJobId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuJobId(null);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuJobId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openMenuJobId]);

  useEffect(() => {
    if (!isActive) {
      setOpenMenuJobId(null);
    }
  }, [isActive]);

  useEffect(() => {
    if (!viewingJob) {
      setKpiData(null);
      return;
    }

    let alive = true;
    setKpiLoading(true);
    const supabase = createClient();

    Promise.all([
      supabase.from("pdf_candidates").select("id", { count: "exact" }).eq("vaga_id", viewingJob.id),
      supabase.from("pdf_candidates").select("score_final").eq("vaga_id", viewingJob.id).not("score_final", "is", null),
      supabase.from("pipeline_entries").select("id", { count: "exact" }).eq("vaga_id", viewingJob.id).eq("status", "shortlist"),
      supabase.from("pipeline_entries").select("id", { count: "exact" }).eq("vaga_id", viewingJob.id).eq("status", "entrevista"),
      supabase.from("pipeline_entries").select("id", { count: "exact" }).eq("vaga_id", viewingJob.id).eq("status", "oferecido"),
      supabase.from("pipeline_entries").select("id", { count: "exact" }).eq("vaga_id", viewingJob.id).eq("status", "contratado"),
    ])
        .then(([candidatesRes, scoresRes, shortlistRes, entrevistasRes, oferecidosRes, contratadosRes]) => {
        if (!alive) return;
        const scores = scoresRes.data as Array<{ score_final: number }> | null;
        setKpiData({
          candidatos: candidatesRes.count ?? 0,
          score: scores && scores.length > 0 ? scores.reduce((sum, row) => sum + Number(row.score_final), 0) / scores.length : null,
          shortlist: shortlistRes.count ?? 0,
          entrevistas: entrevistasRes.count ?? 0,
          oferecidos: oferecidosRes.count ?? 0,
          contratados: contratadosRes.count ?? 0,
          diasAbertos: viewingJob.createdAt
            ? Math.max(0, Math.floor((Date.now() - new Date(viewingJob.createdAt).getTime()) / 86400000))
            : 0,
        });
      })
      .catch(() => {
        if (!alive) return;
        setKpiData({
          candidatos: 0,
          score: null,
          shortlist: 0,
          entrevistas: 0,
          oferecidos: 0,
          contratados: 0,
          diasAbertos: viewingJob.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(viewingJob.createdAt).getTime()) / 86400000)) : 0,
        });
      })
      .finally(() => {
        if (!alive) return;
        setKpiLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [viewingJob]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    if (!newJob.title.trim()) {
      setFormError("Informe o nome da vaga.");
      setIsSaving(false);
      return;
    }

      try {
        if (editingJobId) {
          const existingJob = jobs.find((job) => job.id === editingJobId);
          if (!existingJob) return;

          await onUpdateJob({
            ...existingJob,
            title: newJob.title.trim(),
            department: newJob.area,
            contract: newJob.contract,
            location: newJob.location,
            briefing: newJob.briefing,
            autoAi: newJob.autoAi,
            status: newJob.status,
          });
        } else {
          const createdJob: Job = {
            id: `job-${Date.now()}`,
            title: newJob.title.trim(),
            department: newJob.area,
            contract: newJob.contract,
            location: newJob.location,
            briefing: newJob.briefing,
            autoAi: newJob.autoAi,
            candidatesCount: 0,
            averageScore: 0,
            topScore: 0,
            status: newJob.status,
            createdDate: new Date().toLocaleDateString("pt-BR"),
          };

          await onCreateJob(createdJob);
        }

        setIsModalOpen(false);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar a vaga. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    if (status === "active") return "bg-[#06D6A0]";
    if (status === "paused") return "bg-[#D4AF37]";
    return "bg-[#9CA3AF]";
  };

  const getStatusText = (status: JobStatus) => {
    if (status === "active") return "Ativa";
    if (status === "paused") return "Em pausa";
    return "Encerrada";
  };

  const router = useRouter();

  const handleSelectJob = (job: Job) => {
    const nextSelectedId = selectedJobId === job.id ? null : job.id;
    onSelectJob(nextSelectedId);
    showToast(nextSelectedId ? `Vaga '${job.title}' selecionada` : `Vaga '${job.title}' desselecionada`);
    setOpenMenuJobId(null);
  };

  const handleOpenJob = (job: Job) => {
    setViewingJobId(job.id);
    router.push('/vagas');
    if (selectedJobId !== job.id) {
      onSelectJob(job.id);
    }
  };

  const handlePauseJob = async (job: Job) => {
    try {
      await onChangeJobStatus(job.id, "paused");
      showToast("Vaga pausada com sucesso");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Erro ao pausar a vaga");
    } finally {
      setOpenMenuJobId(null);
    }
  };

  const handleReactivateJob = async (job: Job) => {
    try {
      await onChangeJobStatus(job.id, "active");
      showToast("Vaga reativada com sucesso");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Erro ao reativar a vaga");
    } finally {
      setOpenMenuJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const confirmed = window.confirm("Deseja realmente excluir esta vaga?");
    if (!confirmed) return;

    setDeletingJobId(jobId);
    try {
      await onDeleteJob(jobId);
      showToast("Vaga excluída com sucesso");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Erro ao excluir a vaga");
    } finally {
      setDeletingJobId(null);
      setOpenMenuJobId(null);
    }
  };

  if (viewingJob) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col h-full pt-2 pb-10 w-full animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          onClick={() => setViewingJobId(null)}
          className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors mb-6 w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para vagas
        </button>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-8 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide uppercase ${getStatusColor(viewingJob.status)} bg-opacity-10 border border-current`}>
                {getStatusText(viewingJob.status)}
              </span>
              <span className="text-[13px] text-[#6B7280]">Criada em {viewingJob.createdDate}</span>
            </div>
            <h1 className="text-[28px] font-bold text-[#111827] tracking-tight mb-2">
              {viewingJob.title}
            </h1>
            <p className="text-[15px] text-[#6B7280]">{viewingJob.department}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
              {kpiLoading || !kpiData ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 animate-pulse" />
                ))
              ) : (
                <>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <div className="flex items-center gap-3 mb-3 text-[#6B7280] text-[12px] uppercase tracking-wide">
                      <Users className="w-4 h-4" />
                      Candidatos
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-semibold text-[#111827]">{kpiData.candidatos}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <div className="flex items-center gap-3 mb-3 text-[#6B7280] text-[12px] uppercase tracking-wide">
                      <Star className="w-4 h-4 text-[#F59E0B]" />
                      Score médio
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-semibold text-[#111827]">{kpiData.score !== null ? kpiData.score.toFixed(1) : "—"}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <div className="flex items-center gap-3 mb-3 text-[#6B7280] text-[12px] uppercase tracking-wide">
                      <Check className="w-4 h-4 text-[#16A34A]" />
                      Shortlist
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-semibold text-[#111827]">{kpiData.shortlist}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <div className="flex items-center gap-3 mb-3 text-[#6B7280] text-[12px] uppercase tracking-wide">
                      <CalendarDays className="w-4 h-4" />
                      Dias aberta
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] font-semibold text-[#111827]">{kpiData.diasAbertos}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!kpiLoading && kpiData ? (
              <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.18em] text-[#6B7280] font-semibold">Acompanhamento do processo</p>
                    <h2 className="text-[18px] font-semibold text-[#111827] mt-2">Progresso por estágio</h2>
                  </div>
                  <div className="text-right text-[12px] text-[#6B7280]">
                    Total de candidatos: <span className="font-semibold text-[#111827]">{kpiData.candidatos}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Shortlist", value: kpiData.shortlist, color: "bg-[#DCFCE7]", accent: "bg-[#10B981]" },
                    { label: "Entrevistas", value: kpiData.entrevistas, color: "bg-[#FEF3C7]", accent: "bg-[#D97706]" },
                    { label: "Oferecidos", value: kpiData.oferecidos, color: "bg-[#E9D5FF]", accent: "bg-[#8B5CF6]" },
                    { label: "Contratados", value: kpiData.contratados, color: "bg-[#DCFCE7]", accent: "bg-[#059669]" },
                  ].map((item) => {
                    const percent = kpiData.candidatos > 0 ? Math.round((item.value / kpiData.candidatos) * 100) : 0;
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-[12px] text-[#475569]">
                          <span>{item.label}</span>
                          <span className="font-semibold text-[#111827]">{item.value} ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${item.accent}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => router.push("/candidatos")}
                className="btn-primary bg-[#111827] hover:bg-[#111827]/90 text-white py-2 px-4 rounded-xl text-sm font-semibold"
              >
                Ver candidatos
              </button>
              <button
                onClick={() => router.push("/pipeline")}
                className="btn-ghost py-2 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
              >
                Ver pipeline
              </button>
              <button
                onClick={() => {
                  onSelectJob(viewingJob.id);
                  router.push("/pdf-ranker");
                }}
                className="btn-ghost py-2 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold"
              >
                Abrir PDF Ranker
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-[14px] font-semibold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#9CA3AF]" />
                  Briefing da vaga
                </h3>
                <div className="prose prose-sm max-w-none text-[#4B5563] leading-relaxed whitespace-pre-wrap">
                  {viewingJob.briefing || "Nenhum briefing fornecido."}
                </div>
              </section>
            </div>

            <div className="space-y-6 bg-[#F9FAFB] p-6 rounded-xl border border-[#F3F4F6] h-fit">
              <div>
                <h4 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Localização</h4>
                <div className="flex items-center gap-2 text-[14px] text-[#111827] font-medium">
                  <MapPin className="w-4 h-4 text-[#06D6A0]" />
                  {viewingJob.location || "Não informada"}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Contrato</h4>
                <div className="flex items-center gap-2 text-[14px] text-[#111827] font-medium">
                  <Building className="w-4 h-4 text-[#06D6A0]" />
                  {viewingJob.contract || "Não informado"}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
                <button
                  onClick={() => handleOpenModal(viewingJob)}
                  className="w-full btn-primary"
                >
                  Editar Vaga
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full pt-2 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Vagas</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Gerencie seus processos seletivos abertos</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Vaga
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(["Todas", "Ativas", "Em pausa", "Encerradas"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors border ${
                filter === f
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAFB]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da vaga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-rh pl-10 w-full bg-white"
          />
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[12px] border border-dashed border-[#D1D5DB] min-h-[400px]">
          <div className="w-14 h-14 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-[#9CA3AF]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#111827] mb-2">Nenhuma vaga criada ainda</h3>
          <p className="text-[13px] text-[#6B7280] mb-6 text-center max-w-sm">
            Comece criando sua primeira vaga para iniciar o processo seletivo e triar candidatos com IA.
          </p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Criar primeira vaga
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              ref={job.id === openMenuJobId ? dropdownRef : null}
              className={`bg-white dark:bg-slate-900 rounded-[12px] p-5 border transition-all flex flex-col group relative ${
                job.id === selectedJobId
                  ? "border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/30 dark:ring-blue-500/30 shadow-lg shadow-blue-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500"
              }`}
            >
              {job.id === selectedJobId && (
                <span className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                  SELECIONADA
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {getStatusText(job.status)}
                </span>
              </div>

              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {job.title}
              </h3>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5">Criada em {job.createdDate}</p>

              <div className="flex items-center justify-between py-4 border-y border-slate-100 dark:border-slate-800/80 mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                    <Users className="w-3.5 h-3.5" /> Candidatos
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">{job.candidatesCount}</span>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> Score Médio
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">{job.averageScore.toFixed(1)}</span>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Shortlist
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">
                    {Math.floor(job.candidatesCount * 0.1)}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenJob(job.id);
                    setViewingJobId(job.id);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 rounded-[6px] text-[13px] font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Abrir
                </button>
                <button
                  onClick={() => handleOpenModal(job)}
                  className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded-[6px] text-[13px] font-medium transition-colors border border-slate-200 dark:border-slate-800"
                >
                  Editar
                </button>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuJobId((prev) => (prev === job.id ? null : job.id))}
                    className="px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#6B7280] rounded-[6px] transition-colors border border-[#E5E7EB] flex items-center justify-center"
                    aria-expanded={openMenuJobId === job.id}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenuJobId === job.id ? (
                    <div className="absolute z-50 top-full right-0 mt-2 w-52 rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                      <button
                        onClick={() => {
                          handleOpenModal(job);
                          setOpenMenuJobId(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-[#111827] hover:bg-[#F9FAFB]"
                      >
                        ✎ Editar vaga
                      </button>
                      <button
                        onClick={() => handleSelectJob(job)}
                        className="w-full px-4 py-3 text-left text-sm text-[#111827] hover:bg-[#F9FAFB] flex items-center gap-2"
                      >
                        {selectedJobId === job.id ? (
                          <>
                            <X className="w-4 h-4 text-slate-400" />
                            Desmarcar vaga
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 text-slate-400" />
                            Selecionar vaga
                          </>
                        )}
                      </button>
                      {job.status !== "paused" ? (
                        <button
                          onClick={() => handlePauseJob(job)}
                          className="w-full px-4 py-3 text-left text-sm text-[#111827] hover:bg-[#F9FAFB]"
                        >
                          ⏸ Pausar vaga
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateJob(job)}
                          className="w-full px-4 py-3 text-left text-sm text-[#111827] hover:bg-[#F9FAFB]"
                        >
                          ✓ Reativar vaga
                        </button>
                      )}
                      <div className="border-t border-[#E5E7EB]" />
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deletingJobId === job.id}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingJobId === job.id ? "Excluindo..." : "🗑 Excluir vaga"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] sticky top-0 bg-white z-10">
              <h2 className="text-[18px] font-semibold text-[#111827]">
                {editingJobId ? "Editar Vaga" : "Nova Vaga"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSaveJob} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Nome da vaga *</label>
                  <input
                    required
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="Ex: Desenvolvedor React Sênior"
                    className="input-rh w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Área</label>
                    <select
                      value={newJob.area}
                      onChange={(e) => setNewJob({ ...newJob, area: e.target.value })}
                      className="input-rh w-full cursor-pointer"
                    >
                      <option>Tecnologia</option>
                      <option>Comercial</option>
                      <option>Design</option>
                      <option>Administrativo</option>
                      <option>RH</option>
                      <option>Marketing</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Tipo de contrato</label>
                    <select
                      value={newJob.contract}
                      onChange={(e) => setNewJob({ ...newJob, contract: e.target.value })}
                      className="input-rh w-full cursor-pointer"
                    >
                      <option>CLT</option>
                      <option>PJ</option>
                      <option>Freelancer</option>
                      <option>Estágio</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Localização</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="Ex: São Paulo, SP (ou Remoto)"
                      className="input-rh w-full"
                    />
                  </div>
                  {editingJobId && (
                    <div>
                      <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Status da vaga</label>
                      <select
                        value={newJob.status}
                        onChange={(e) => setNewJob({ ...newJob, status: e.target.value as JobStatus })}
                        className="input-rh w-full cursor-pointer"
                      >
                        <option value="active">Ativa</option>
                        <option value="paused">Em pausa</option>
                        <option value="completed">Encerrada</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Briefing da vaga</label>
                  <textarea
                    rows={4}
                    value={newJob.briefing}
                    onChange={(e) => setNewJob({ ...newJob, briefing: e.target.value })}
                    placeholder="Cole aqui a descrição completa da vaga, requisitos, responsabilidades..."
                    className="input-rh w-full resize-none"
                  />
                </div>

                <div className="bg-[#F0FDF9] p-4 rounded-[8px] flex items-start gap-3 border border-[#06D6A0]/20">
                  <input
                    type="checkbox"
                    id="auto-ai"
                    checked={newJob.autoAi}
                    onChange={(e) => setNewJob({ ...newJob, autoAi: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-[#06D6A0] focus:ring-[#06D6A0] cursor-pointer"
                  />
                  <div>
                    <label htmlFor="auto-ai" className="text-[13px] font-semibold text-[#059669] cursor-pointer block">
                      Gerar critérios com IA automaticamente
                    </label>
                    <p className="text-[12px] text-[#065F46] mt-1 leading-relaxed">
                      O Agente IA irá ler o briefing da sua vaga e extrair automaticamente os principais critérios para avaliar os currículos.
                    </p>
                  </div>
                </div>

                {formError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div className="pt-6 mt-4 border-t border-[#E5E7EB] flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editingJobId ? "Salvando..." : "Criando..."}
                      </>
                    ) : (
                      editingJobId ? "Salvar alterações" : "Criar vaga"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
