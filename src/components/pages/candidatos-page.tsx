"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import type { Candidate, KanbanStatus } from "@/lib/types";
import {
  Search, SlidersHorizontal, Filter, MoreHorizontal, ExternalLink,
  Star, Lock, Video, Calendar, Eye, Sparkles, Check, ChevronDown
} from "lucide-react";
import { useEmpresa } from "@/hooks/useEmpresa";
import MeetingsSchedulerModal from "@/components/MeetingsSchedulerModal";

interface CandidatosPageProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onMoveCandidate?: (id: string, newStatus: KanbanStatus) => void;
}

function FiltrosAvancados() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h3 className="mb-3 text-xs font-bold text-slate-800 uppercase tracking-wider">Filtros Gerais de Sourcing</h3>
      <div className="grid gap-3.5 md:grid-cols-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Localidade</label>
          <input
            type="text"
            placeholder="Ex: Parana, Curitiba..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Senioridade</label>
          <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition cursor-pointer">
            <option value="">Qualquer Nível</option>
            <option value="junior">Júnior</option>
            <option value="pleno">Pleno</option>
            <option value="senior">Sênior</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Modalidade</label>
          <input
            type="text"
            placeholder="Ex: Remoto, Híbrido..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition"
          />
        </div>
      </div>
    </div>
  );
}

export default function CandidatosPage({ candidates, onSelectCandidate, onMoveCandidate }: CandidatosPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(true);
  const { empresa, isLoading: isLoadingEmpresa } = useEmpresa();

  // Scheduler Modal state
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // Trial lock check
  const isCrmLocked = !isLoadingEmpresa && empresa && (() => {
    const plano = (empresa.plano || 'trial').toLowerCase();
    const subStatus = empresa.subscription_status || '';
    const isTrialPlan = plano === 'trial' || plano === 'trial_starter';
    const isAdmin = ['admin', 'superadmin'].includes((empresa.role || '').toLowerCase());
    return isTrialPlan && !isAdmin && subStatus !== 'active';
  })();

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    if (showOnlyFavorites) {
      list = list.filter((c) => c.shortlist || c.status === "shortlist");
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter(c => c.status === statusFilter);
    }

    return list.sort((a, b) => b.score - a.score);
  }, [candidates, searchTerm, statusFilter, showOnlyFavorites]);

  const renderStatusBadge = (status: string) => {
    const map: Record<string, { label: string, color: string, bg: string, border: string }> = {
      triado: { label: "Triado", color: "#4B5563", bg: "#F3F4F6", border: "#E5E7EB" },
      shortlist: { label: "Shortlist", color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
      entrevista: { label: "Entrevista", color: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
      oferecido: { label: "Oferecido", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
      contratado: { label: "Contratado", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
    };

    const conf = map[status] || map.triado;
    return (
      <span
        className="px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap uppercase tracking-wider"
        style={{ color: conf.color, backgroundColor: conf.bg, borderColor: conf.border }}
      >
        {conf.label}
      </span>
    );
  };

  const handleOpenScheduler = (c: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setSchedulingCandidate(c);
    setIsSchedulerOpen(true);
  };

  if (isCrmLocked) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-96 gap-5 rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">CRM de Candidatos</h2>
            <p className="text-slate-500 max-w-md leading-relaxed text-xs">
              O CRM completo está disponível nos planos <strong>Starter, Pro e Agência</strong>.
              No Trial, os candidatos ficam apenas no Pipeline (triagem temporária).
            </p>
          </div>
          <Link
            href="/configuracoes"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-full font-semibold text-xs hover:from-indigo-700 hover:to-violet-700 transition shadow-md hover:shadow-lg"
          >
            Ver Planos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-10 px-6">
      {/* Top Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidatos (CRM)</h1>
          <p className="text-xs text-slate-500 mt-1">Gestão centralizada de talentos importados, avaliados e ranqueados.</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Exportar CSV
        </button>
      </div>

      <FiltrosAvancados />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquise por nome, empresa ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-violet-500 transition shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowOnlyFavorites((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
              showOnlyFavorites
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className={`w-4 h-4 ${showOnlyFavorites ? "fill-amber-400 text-amber-500" : ""}`} strokeWidth={1.8} />
            {showOnlyFavorites ? "Apenas favoritos" : "Mostrar todos"}
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold outline-none focus:border-violet-500 cursor-pointer shadow-xs"
            >
              <option value="all">Todos os status</option>
              <option value="triado">Triado</option>
              <option value="shortlist">Shortlist</option>
              <option value="entrevista">Entrevista</option>
              <option value="oferecido">Oferecido</option>
              <option value="contratado">Contratado</option>
            </select>
          </div>

          <button className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" /> Mais filtros
          </button>
        </div>
      </div>

      {/* Candidates Enterprise Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-5 py-4">Nome completo</th>
                <th className="px-5 py-4">Fit Score</th>
                <th className="px-5 py-4">Função atual</th>
                <th className="px-5 py-4">Status no Pipeline</th>
                <th className="px-5 py-4">Etiquetas IA</th>
                <th className="px-5 py-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCandidate(c)}
                  className="group cursor-pointer hover:bg-slate-50/70 transition-colors bg-white"
                >
                  {/* Name & Avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs border border-slate-100"
                        style={{ backgroundColor: c.avatarColor + "15", color: c.avatarColor }}
                      >
                        {c.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.city || "Paraná, Brasil"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {c.score > 0 ? c.score.toFixed(1) : "—"}
                    </span>
                  </td>

                  {/* Function & Company */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-medium text-slate-800 truncate max-w-[180px]">{c.role}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{c.company}</p>
                  </td>

                  {/* Pipeline Status */}
                  <td className="px-5 py-3.5">
                    {renderStatusBadge(c.status)}
                  </td>

                  {/* AI Tags */}
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.confirmedTags && c.confirmedTags.length > 0 ? (
                        c.confirmedTags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-100">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenScheduler(c, e)}
                        className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Agendar Entrevista"
                      >
                        <Video className="w-3.5 h-3.5" /> Agendar
                      </button>

                      <button
                        onClick={() => onSelectCandidate(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Ver Perfil 360°"
                      >
                        <Eye className="w-3.5 h-3.5" /> Perfil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-xs text-slate-500 bg-white">
                    {showOnlyFavorites
                      ? "Nenhum candidato favoritado no CRM."
                      : "Nenhum candidato corresponde aos filtros selecionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meetings Scheduler Modal */}
      <MeetingsSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        candidate={schedulingCandidate}
        onConfirmSchedule={(candId, date, time) => {
          if (onMoveCandidate) onMoveCandidate(candId, "entrevista");
        }}
      />
    </div>
  );
}
