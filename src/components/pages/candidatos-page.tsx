"use client";

import Link from "next/link";

import React, { useState, useMemo } from "react";
import type { Candidate } from "@/lib/types";
import { Search, SlidersHorizontal, Filter, MoreHorizontal, ExternalLink, MessageCircle, Star, Lock } from "lucide-react";

function FiltrosAvancados({ filtrosAtivos }: { filtrosAtivos?: Record<string, unknown> | null }) {
  const filtros = filtrosAtivos || { localidade: "", senioridade: "", modalidade: "" };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Filtros Gerais de Sourcing</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="text"
          placeholder="Localidade..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          defaultValue={String((filtros as Record<string, unknown>).localidade || "")}
        />
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          defaultValue={String((filtros as Record<string, unknown>).senioridade || "")}
        >
          <option value="">Qualquer Nível</option>
          <option value="junior">Júnior</option>
          <option value="pleno">Pleno</option>
          <option value="senior">Sênior</option>
        </select>
        <input
          type="text"
          placeholder="Modalidade..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 md:col-span-2"
          defaultValue={String((filtros as Record<string, unknown>).modalidade || "")}
        />
      </div>
    </div>
  );
}
import { useEmpresa } from "@/hooks/useEmpresa";

interface CandidatosPageProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
}

export default function CandidatosPage({ candidates, onSelectCandidate }: CandidatosPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(true);
  const { empresa, isLoading: isLoadingEmpresa } = useEmpresa();

  // Detect trial plan for CRM restriction
  const isCrmLocked = !isLoadingEmpresa && empresa && (() => {
    const plano = (empresa.plano || 'trial').toLowerCase();
    const subStatus = empresa.subscription_status || '';
    const isTrialPlan = plano === 'trial' || plano === 'trial_starter';
    const isAdmin = ['admin', 'superadmin'].includes((empresa.role || '').toLowerCase());
    return isTrialPlan && !isAdmin && subStatus !== 'active';
  })();

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    // Management page only keeps favorited candidates
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
    const map: Record<string, { label: string, color: string, bg: string }> = {
      triado: { label: "Triado", color: "#6B7280", bg: "#F3F4F6" }, 
      shortlist: { label: "Shortlist", color: "#00B4D8", bg: "rgba(0,180,216,0.1)" }, 
      entrevista: { label: "Entrevista", color: "#D4AF37", bg: "rgba(212,175,55,0.1)" }, 
      oferecido: { label: "Oferecido", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" }, 
      contratado: { label: "Contratado", color: "#059669", bg: "rgba(5,150,105,0.1)" }, 
    };
    
    const conf = map[status] || map.triado;
    return (
      <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium whitespace-nowrap" style={{ color: conf.color, backgroundColor: conf.bg }}>
        {conf.label}
      </span>
    );
  };

  if (isCrmLocked) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-96 gap-5 rounded-[28px] border border-slate-200 bg-white p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">CRM de Candidatos</h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              O CRM completo está disponível nos planos <strong>Starter, Pro e Agência</strong>.
              No Trial, os candidatos ficam apenas no Pipeline (triagem temporária).
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center max-w-sm">
            {["Histórico permanente", "Etiquetas IA", "Exportar CSV"].map(f => (
              <div key={f} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[12px] font-medium text-slate-600">{f}</p>
              </div>
            ))}
          </div>
          <Link
            href="/configuracoes"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-full font-semibold text-[15px] hover:from-indigo-700 hover:to-violet-700 transition shadow-md hover:shadow-lg"
          >
            Ver Planos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-2 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827] tracking-tight">Candidatos</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Gestão centralizada de talentos importados, avaliados e ranqueados.</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 bg-white">
          <Filter className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <FiltrosAvancados filtrosAtivos={null} />

      {/* ── Barra de Filtros ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Pesquise por nome, empresa ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-rh w-full pl-10 bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowOnlyFavorites((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-[9px] rounded-lg text-[13px] font-medium border transition-all ${
              showOnlyFavorites
                ? "bg-[#FFFBEA] border-[#F5C000] text-[#B45309]"
                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
            }`}
          >
            <Star className={`w-4 h-4 ${showOnlyFavorites ? "fill-[#F5C000] text-[#F5C000]" : ""}`} strokeWidth={1.8} />
            {showOnlyFavorites ? "Apenas favoritos" : "Mostrar todos"}
          </button>

          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#6B7280]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-rh py-[9px] bg-white cursor-pointer"
            >
              <option value="all">Todos os status</option>
              <option value="triado">Triado</option>
              <option value="shortlist">Shortlist</option>
              <option value="entrevista">Entrevista</option>
              <option value="oferecido">Oferecido</option>
              <option value="contratado">Contratado</option>
            </select>
          </div>

          <button className="btn-ghost bg-white flex items-center gap-2 h-auto py-[9px]">
            <SlidersHorizontal className="w-4 h-4" /> Mais filtros
          </button>
        </div>
      </div>

      {/* ── Tabela CRM ──────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="px-5 py-4 font-medium">Nome completo</th>
                <th className="px-5 py-4 font-medium">Score</th>
                <th className="px-5 py-4 font-medium">Função atual</th>
                <th className="px-5 py-4 font-medium">Status do Pipeline</th>
                <th className="px-5 py-4 font-medium">Etiquetas IA</th>
                <th className="px-5 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredCandidates.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => onSelectCandidate(c)}
                  className="group cursor-pointer hover:bg-[#F9FAFB] transition-colors bg-[#FFFFFF]"
                >
                  {/* Nome e Avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0" style={{ backgroundColor: c.avatarColor + "15", color: c.avatarColor }}>
                        {c.initials}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#111827] group-hover:text-[#06D6A0] transition-colors">{c.name}</p>
                        <p className="text-[12px] text-[#6B7280]">{c.city}</p>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FEF08A]">
                      <span className="text-[12px] font-semibold text-[#854D0E]">{c.score > 0 ? c.score.toFixed(1) : "—"}</span>
                    </div>
                  </td>

                  {/* Função / Empresa */}
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] text-[#111827] truncate max-w-[150px]">{c.role}</p>
                    <p className="text-[12px] text-[#6B7280] truncate max-w-[150px]">{c.company}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {renderStatusBadge(c.status)}
                  </td>

                  {/* Etiquetas */}
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {c.etiqueta ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: c.etiqueta.cor, color: '#fff' }}>
                          {c.etiqueta.nome}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#9CA3AF]">—</span>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#06D6A0] hover:bg-[#F0FDF9] transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <Link href={c.linkedinUrl && c.linkedinUrl !== "#" ? c.linkedinUrl : "#"} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#06D6A0] hover:bg-[#F0FDF9] transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[13px] text-[#6B7280] bg-white">
                    {showOnlyFavorites
                      ? "Nenhum candidato favoritado. Use a estrela no PDF Ranker para salvar no CRM."
                      : "Nenhum candidato corresponde aos filtros selecionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
