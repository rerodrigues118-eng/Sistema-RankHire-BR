"use client";

import React, { useState } from "react";
import { Search, Plus, MoreHorizontal, Briefcase, Users, Star, CheckCircle2, X } from "lucide-react";
import type { Job, JobStatus } from "@/lib/types";

type FilterStatus = "Todas" | "Ativas" | "Em pausa" | "Encerradas";

interface VagasPageProps {
  jobs: Job[];
  onCreateJob: (job: Job) => void | Promise<void>;
  onUpdateJob: (job: Job) => void | Promise<void>;
  onOpenJob: (jobId: string) => void;
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

export default function VagasPage({ jobs, onCreateJob, onUpdateJob, onOpenJob }: VagasPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState<JobDraft>(DEFAULT_DRAFT);

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

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJob.title.trim()) {
      return;
    }

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
      onOpenJob(createdJob.id);
    }

    setIsModalOpen(false);
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

        <div className="relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome da vaga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-rh pl-9 w-72 bg-white"
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
            <div key={job.id} className="bg-white rounded-[12px] p-5 border border-[#E5E7EB] hover:border-[#06D6A0] transition-colors flex flex-col group">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  {getStatusText(job.status)}
                </span>
              </div>

              <h3 className="text-[16px] font-semibold text-[#111827] leading-tight mb-1 group-hover:text-[#06D6A0] transition-colors">
                {job.title}
              </h3>
              <p className="text-[12px] text-[#9CA3AF] mb-5">Criada em {job.createdDate}</p>

              <div className="flex items-center justify-between py-4 border-y border-[#F3F4F6] mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] mb-1">
                    <Users className="w-3.5 h-3.5" /> Candidatos
                  </div>
                  <span className="font-semibold text-[#111827] text-[15px]">{job.candidatesCount}</span>
                </div>
                <div className="w-px h-8 bg-[#F3F4F6]" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] mb-1">
                    <Star className="w-3.5 h-3.5" /> Score Médio
                  </div>
                  <span className="font-semibold text-[#111827] text-[15px]">{job.averageScore.toFixed(1)}</span>
                </div>
                <div className="w-px h-8 bg-[#F3F4F6]" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist
                  </div>
                  <span className="font-semibold text-[#111827] text-[15px]">
                    {Math.floor(job.candidatesCount * 0.1)}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenJob(job.id)}
                  className="flex-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] py-2 rounded-[6px] text-[13px] font-medium transition-colors border border-[#E5E7EB]"
                >
                  Abrir
                </button>
                <button
                  onClick={() => handleOpenModal(job)}
                  className="flex-1 bg-white hover:bg-[#F9FAFB] text-[#374151] py-2 rounded-[6px] text-[13px] font-medium transition-colors border border-[#E5E7EB]"
                >
                  Editar
                </button>
                <button className="px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#6B7280] rounded-[6px] transition-colors border border-[#E5E7EB] flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
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

                <div className="pt-6 mt-4 border-t border-[#E5E7EB] flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingJobId ? "Salvar alterações" : "Criar vaga"}
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
