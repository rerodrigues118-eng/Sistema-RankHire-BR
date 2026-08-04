"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Job, Candidate, UploadFile } from "@/lib/types";
import {
  UploadCloud,
  RefreshCw,
  Filter,
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

interface PdfCriterion {
  id?: string;
  nome: string;
  peso: number;
  _tempId?: string; // local only, for rendering
}

interface PdfRankerPageProps {
  activeJob: Job;
  candidates: Candidate[];
  uploads: UploadFile[];
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectCandidate: (c: Candidate) => void;
  onToggleShortlist?: (id: string) => void;
  onDeleteCandidates?: (ids: string[]) => void;
  quota?: {
    isAdmin: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    plano: string;
    mes: string;
  } | null;
}

type SaveCriteriaResult = {
  ok: boolean;
  vaga: string;
};

/* ── Status helpers ──────────────────────────────────────── */
function statusLabel(status: UploadFile["status"]) {
  switch (status) {
    case "completed": return "Triado ✓";
    case "extracting":
    case "scoring": return "Executando";
    case "failed": return "Falhou";
    default: return "Aguardando";
  }
}

function statusColor(status: UploadFile["status"]) {
  if (status === "completed") return "text-emerald-700 bg-emerald-50 border border-emerald-200";
  if (status === "failed") return "text-rose-700 bg-rose-50 border border-rose-200";
  return "text-blue-700 bg-blue-50 border border-blue-200";
}

function barColor(status: UploadFile["status"]) {
  if (status === "completed") return "#10B981";
  if (status === "failed") return "#F43F5E";
  return "#7C3AED";
}

const SUGGESTED_CRITERIA: { nome: string; peso: number }[] = [
  { nome: "Experiência na área", peso: 3 },
  { nome: "Formação acadêmica", peso: 3 },
  { nome: "Habilidades técnicas", peso: 3 },
  { nome: "Idiomas", peso: 3 },
  { nome: "Fit cultural", peso: 3 },
];

let localTempId = 0;
function nextTempId() {
  return `new-${++localTempId}`;
}

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export default function PdfRankerPage({
  activeJob,
  candidates,
  uploads,
  isUploading,
  onFileUpload,
  fileInputRef,
  onSelectCandidate,
  onToggleShortlist,
  onDeleteCandidates,
  quota,
}: PdfRankerPageProps) {
  const [activeTab, setActiveTab] = useState<"triagem" | "funil">("triagem");
  const [criteria, setCriteria] = useState<PdfCriterion[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);
  const [criteriaLoaded, setCriteriaLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [localQuota, setLocalQuota] = useState<typeof quota | null>(quota ?? null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingResults, setIsClearingResults] = useState(false);
  const [hiddenFromResults, setHiddenFromResults] = useState<Set<string>>(new Set());

  const { addNotification } = useNotifications();

  const topCandidates = candidates
    .filter((candidate) => candidate.vagaId === activeJob.id && !hiddenFromResults.has(candidate.id))
    .sort((a, b) => b.score - a.score);
  const hasCriteria = criteria.some((c) => c.nome && c.nome.trim().length > 0);

  // Calculated quota status
  const currentQuota = localQuota || quota;
  const isLimitReached = !!(currentQuota && !currentQuota.isAdmin && currentQuota.limit !== null && currentQuota.used >= currentQuota.limit);

  /* ── Clear results: delete non-favorited from DB, hide favorited locally ───── */
  const handleClearResults = useCallback(async () => {
    const allCandidatesForJob = candidates.filter(
      (c) => c.vagaId === activeJob.id && !hiddenFromResults.has(c.id)
    );
    const toDelete = allCandidatesForJob.filter((c) => !c.shortlist);
    const toHide = allCandidatesForJob.filter((c) => c.shortlist);

    if (allCandidatesForJob.length === 0) {
      showToast("info", "Nenhum candidato para remover.");
      setShowClearConfirm(false);
      return;
    }

    setIsClearingResults(true);
    const deletedIds: string[] = [];
    let failCount = 0;

    await Promise.all(
      toDelete.map(async (c) => {
        try {
          const res = await fetch(`/api/candidates/${c.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            deletedIds.push(c.id);
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      })
    );

    if (toHide.length > 0) {
      setHiddenFromResults((prev) => {
        const next = new Set(prev);
        toHide.forEach((c) => next.add(c.id));
        return next;
      });
    }

    setIsClearingResults(false);
    setShowClearConfirm(false);

    if (deletedIds.length > 0) {
      onDeleteCandidates?.(deletedIds);
    }
    const totalRemoved = deletedIds.length + toHide.length;
    if (totalRemoved > 0) {
      const msg = toHide.length > 0
        ? `${totalRemoved} candidato(s) removido(s) da triagem. ${toHide.length} favorito(s) mantido(s) no CRM/Pipeline.`
        : `${totalRemoved} candidato(s) removido(s) da triagem.`;
      showToast("success", msg);
    }
    if (failCount > 0) {
      showToast("error", `${failCount} candidato(s) não puderam ser removidos.`);
    }
  }, [candidates, activeJob.id, hiddenFromResults, onDeleteCandidates]);

  /* ── Toast helpers ────────────────────────── */
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    addNotification({
      type,
      title: type === "success" ? "PDF Ranker" : type === "error" ? "Erro na Triagem" : "Informação",
      message,
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, [addNotification]);

  /* ── Load criteria for active job ─────────── */
  const loadCriteria = useCallback(async () => {
    if (!activeJob?.id) return;
    setIsLoadingCriteria(true);
    try {
      const res = await fetch(`/api/vagas/${activeJob.id}/criteria`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.criteria) && data.criteria.length > 0) {
        setCriteria(
          data.criteria.map((c: PdfCriterion) => ({
            id: c.id,
            nome: c.nome,
            peso: c.peso ?? 3,
          }))
        );
      } else {
        setCriteria([]);
      }
    } catch {
      showToast("error", "Erro ao carregar critérios da vaga.");
      setCriteria([]);
    } finally {
      setIsLoadingCriteria(false);
      setCriteriaLoaded(true);
    }
  }, [activeJob?.id, showToast]);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  /* ── Add / Remove / Update criteria local ─── */
  const handleAddCriteria = (nome = "", peso = 3) => {
    setCriteria((prev) => [...prev, { nome, peso, _tempId: nextTempId() }]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, field: "nome" | "peso", value: string | number) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  /* ── Save criteria to DB ───────────────────── */
  const handleSaveCriteria = async () => {
    if (!activeJob?.id) return;
    const valid = criteria.filter((c) => c.nome && c.nome.trim().length > 0);
    if (valid.length === 0) {
      showToast("error", "Adicione pelo menos um critério válido.");
      return;
    }
    setIsSavingCriteria(true);
    try {
      const res = await fetch(`/api/vagas/${activeJob.id}/criteria`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: valid.map((c) => ({ nome: c.nome.trim(), peso: c.peso })),
        }),
      });
      const data: SaveCriteriaResult = await res.json();
      if (res.ok) {
        showToast("success", "Critérios salvos com sucesso!");
        await loadCriteria();
      } else {
        showToast("error", (data as unknown as { error?: string }).error || "Erro ao salvar critérios.");
      }
    } catch {
      showToast("error", "Erro de conexão ao salvar critérios.");
    } finally {
      setIsSavingCriteria(false);
    }
  };

  /* ── Generate criteria via AI (Groq) ───────── */
  const handleGenerateCriteria = async () => {
    if (!activeJob?.id) return;
    setIsGeneratingCriteria(true);
    try {
      const res = await fetch(`/api/vagas/${activeJob.id}/criteria/generate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.criteria) && data.criteria.length > 0) {
        setCriteria(
          data.criteria.map((c: PdfCriterion) => ({
            id: c.id,
            nome: c.nome,
            peso: c.peso ?? 3,
            _tempId: nextTempId(),
          }))
        );
        showToast("success", "Critérios gerados com sucesso pela IA!");
      } else {
        showToast("error", data.error || "Erro ao gerar critérios com a IA.");
      }
    } catch {
      showToast("error", "Erro de conexão ao gerar critérios.");
    } finally {
      setIsGeneratingCriteria(false);
    }
  };

  const suggestionsToShow = SUGGESTED_CRITERIA.filter(
    (s) => !criteria.some((c) => c.nome.toLowerCase() === s.nome.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 font-sans text-slate-800">
      {/* ── Toast notifications ───────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 ${
              t.type === "success"
                ? "bg-slate-900 text-white border border-slate-800"
                : t.type === "error"
                ? "bg-rose-950 text-rose-100 border border-rose-800"
                : "bg-purple-950 text-purple-100 border border-purple-800"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : t.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      {/* ── 1. CABEÇALHO LIMPO COM CONTADOR DE USO DO PLANO ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PDF Ranker</h1>
            
            {/* Inline Quota Counter Badge (Plano Financeiro) */}
            {currentQuota && (
              <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold text-blue-700">
                {currentQuota.isAdmin ? (
                  <>
                    <ShieldCheck size={14} className="text-[#7C3AED]" />
                    <span>Processamento Ilimitado (Plano Pro/Admin)</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-[#7C3AED]" />
                    <span>
                      {currentQuota.used} / {currentQuota.limit ?? '—'} PDFs triados este mês
                    </span>
                    <div className="w-16 h-1.5 bg-purple-200/60 rounded-full overflow-hidden ml-1">
                      <div
                        className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                        style={{
                          width: `${currentQuota.limit ? Math.min(100, Math.round((currentQuota.used / currentQuota.limit) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Triagem automatizada de currículos em massa com pontuação por IA para a vaga{" "}
            <strong className="text-slate-800">{activeJob.title}</strong>.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-shrink-0 border border-slate-200">
          <button
            onClick={() => setActiveTab("triagem")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "triagem"
                ? "bg-white text-[#7C3AED] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Triagem de PDFs
          </button>
          <button
            onClick={() => setActiveTab("funil")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "funil"
                ? "bg-white text-[#7C3AED] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Filter className="w-4 h-4" />
            Funil de Critérios
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── TAB: TRIAGEM DE PDFs ───────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === "triagem" && (
        <div className="space-y-6">
          
          {/* Warning if criteria not set */}
          {!hasCriteria && criteriaLoaded && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Configure os critérios na aba <strong>Funil de Critérios</strong> antes de importar currículos.</span>
              </div>
              <button
                onClick={() => setActiveTab("funil")}
                className="text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                Configurar Critérios →
              </button>
            </div>
          )}

          {/* Warning if Plan limit reached */}
          {isLimitReached && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Você atingiu o limite mensal de <strong>{currentQuota?.limit} currículos</strong> do seu plano financeiro.</span>
              </div>
              <button
                onClick={() => showToast("info", "Redirecionando para atualização de plano...")}
                className="text-xs font-bold text-white bg-rose-600 px-3.5 py-1.5 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Fazer Upgrade
              </button>
            </div>
          )}

          {/* ── 2. DROPZONE COMPACTA & ELEGANTE ── */}
          <button
            type="button"
            disabled={!hasCriteria || isLimitReached}
            onClick={() => {
              if (!hasCriteria) {
                showToast("info", "Configure os critérios do funil antes de importar.");
                return;
              }
              if (isLimitReached) {
                showToast("error", "Limite mensal de PDFs atingido para o seu plano.");
                return;
              }
              fileInputRef.current?.click();
            }}
            className={`w-full rounded-2xl py-5 px-6 flex items-center justify-between gap-4 transition-all duration-200 border border-dashed text-left group ${
              hasCriteria && !isLimitReached
                ? "border-slate-300 hover:border-blue-600 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer shadow-2xs"
                : "border-slate-200 bg-slate-100/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                  Arraste currículos em PDF ou clique para selecionar
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Aceita múltiplos arquivos simultâneos · Formato .pdf
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className="px-4 py-2 bg-white text-blue-700 font-bold text-xs border border-blue-200 rounded-xl shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                + Selecionar Arquivos
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              disabled={!hasCriteria || isLimitReached}
              onChange={onFileUpload}
            />
          </button>

          {/* ── 3. LAYOUT EM DUAS COLUNAS (FILA VS RESULTADOS) ── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Coluna Esquerda: Fila de Processamento (Compacta) */}
            <div className="w-full lg:w-[320px] flex flex-col flex-shrink-0 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#7C3AED] ${isUploading ? "animate-spin" : ""}`} />
                  Fila de Upload ({uploads.length})
                </h2>
              </div>

              {uploads.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Nenhum arquivo em processamento
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {uploads.map((file, idx) => {
                    const isActive = file.status === "extracting" || file.status === "scoring";
                    return (
                      <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex-shrink-0 ${statusColor(file.status)}`}>
                            {statusLabel(file.status)}
                          </span>
                        </div>

                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${file.progress}%`,
                              backgroundColor: barColor(file.status),
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna Direita: Resultados da Triagem (Estilo Busca Inteligente) */}
            <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    Resultados da Triagem ({topCandidates.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Candidatos ranqueados e organizados pelo nível de compatibilidade com a vaga
                  </p>
                </div>

                {topCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-lg px-3 py-1.5 transition-all font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Esvaziar</span>
                  </button>
                )}
              </div>

              {/* ── 4. REFINAMENTO DOS CARDS DE RESULTADOS (Padrão Busca Inteligente) ── */}
              {topCandidates.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center gap-2">
                  <FileCode size={24} className="text-slate-300" />
                  <span>Nenhum candidato processado ainda nesta sessão.</span>
                  <span className="text-[11px] text-slate-400">Faça o upload de currículos em PDF acima para iniciar o ranqueamento.</span>
                </div>
              ) : (
                <div className="space-y-1 divide-y divide-slate-100">
                  {topCandidates.map((c) => {
                    const firstTag = c.confirmedTags[0] || c.partialTags[0] || c.otherTags[0];
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSelectCandidate(c)}
                        className="py-3.5 px-3 hover:bg-slate-50/80 transition-all rounded-xl cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        {/* Avatar & Infos */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleShortlist?.(c.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              c.shortlist ? "text-[#7C3AED]" : "text-slate-300 hover:text-slate-500"
                            }`}
                            title={c.shortlist ? "Remover da Shortlist" : "Adicionar à Shortlist"}
                          >
                            <Star className={`w-4 h-4 ${c.shortlist ? "fill-[#7C3AED]" : ""}`} />
                          </button>

                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: c.avatarColor + "20", color: c.avatarColor }}
                          >
                            {c.initials}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors truncate">
                              {c.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {c.role || "Candidato"} {c.company ? `· ${c.company}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Micro-tags & Score */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {firstTag && (
                            <span className="hidden sm:inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[130px]">
                              {firstTag}
                            </span>
                          )}

                          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <span className="text-xs font-black">
                              {c.score > 0 ? c.score.toFixed(1) : "—"}
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold">/ 5.0</span>
                          </div>

                          <ChevronRight size={16} className="text-slate-300 group-hover:text-[#7C3AED] transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Clear Results Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] max-w-[calc(100vw-32px)] border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Esvaziar Resultados da Triagem</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Os candidatos não favoritados serão removidos da lista.
                </p>
                <p className="text-[11px] text-emerald-800 bg-emerald-50 rounded-xl p-2.5 mt-2 border border-emerald-100 font-medium">
                  ✓ Candidatos favoritados (⭐) permanecerão no CRM e Pipeline.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingResults}
                className="text-xs text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearResults}
                disabled={isClearingResults}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl px-4 py-2 transition-colors cursor-pointer shadow-xs"
              >
                {isClearingResults ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirmar Esvaziamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── TAB: FUNIL DE CRITÉRIOS ──────────────── */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === "funil" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
            <Sparkles className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 leading-relaxed">
              Configure os critérios e pesos que a IA usará para analisar e pontuar os currículos da vaga{" "}
              <strong className="text-slate-900">{activeJob.title}</strong>. Pesos maiores aumentam a relevância do critério no score final.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Critérios de Avaliação</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escala de peso de 1 (baixo) a 5 (essencial)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleGenerateCriteria}
                  disabled={isGeneratingCriteria || isLoadingCriteria}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white hover:bg-[#6d28d9] rounded-xl text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isGeneratingCriteria ? "Gerando..." : "Gerar com IA"}
                </button>
                <button
                  onClick={() => handleAddCriteria()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar critério
                </button>
              </div>
            </div>

            {isLoadingCriteria ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
                <span className="text-xs font-medium">Carregando critérios...</span>
              </div>
            ) : criteria.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Filter className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs font-bold text-slate-700">Nenhum critério configurado</p>
                <p className="text-xs text-slate-400">Adicione critérios ou use as sugestões abaixo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criteria.map((crit, index) => (
                  <div key={crit.id || crit._tempId || index} className="flex items-center gap-3 group">
                    <input
                      type="text"
                      value={crit.nome}
                      onChange={(e) => handleUpdateCriteria(index, "nome", e.target.value)}
                      placeholder="Nome do critério…"
                      className="flex-1 text-xs text-slate-900 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all font-medium"
                    />

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-medium">Peso</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <button
                            key={w}
                            onClick={() => handleUpdateCriteria(index, "peso", w)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              crit.peso === w
                                ? "bg-[#7C3AED] text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveCriteria(index)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remover critério"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveCriteria}
                disabled={isSavingCriteria}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSavingCriteria ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          {suggestionsToShow.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {suggestionsToShow.map((s) => (
                  <button
                    key={s.nome}
                    onClick={() => handleAddCriteria(s.nome, s.peso)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {s.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
