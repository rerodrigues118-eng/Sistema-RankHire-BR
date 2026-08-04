import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Candidate, Job, KanbanStatus } from "@/lib/types";
import { getAvatarBg } from "@/lib/mock-data";
import { shouldRevealContacts } from "@/lib/planos";
import {
  X, ExternalLink, Star, ChevronDown, ChevronUp, MapPin, Building, Briefcase,
  Mail, Phone, CircleDollarSign, Calendar, FileText, Edit2, Check, History, Link as LinkIcon,
  CheckCircle2, User, type LucideIcon, Loader2, AlertCircle, Sparkles, Download,
  MoreVertical, UserPlus, Flag, Plus, FileCode
} from "lucide-react";

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  activeJob?: Job | null;
  onToggleShortlist: (id: string) => void;
  onMoveCandidate: (id: string, newStatus: KanbanStatus) => void;
  onUpdateCandidate?: (updated: Candidate) => void;
  onExportSuccess?: () => void;
  quota?: {
    isAdmin: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    plano: string;
    mes: string;
  } | null;
}

type ToastType = "success" | "error";

interface EditableFieldProps {
  label: string;
  icon: LucideIcon;
  fieldKey: keyof Candidate;
  value?: string;
  isTextArea?: boolean;
  editingField: string | null;
  editValue: string;
  savingField: string | null;
  onChangeEditValue: (value: string) => void;
  onStartEdit: (field: keyof Candidate, value: string) => void;
  onCancelEdit: () => void;
  onSaveField: (field: keyof Candidate) => void;
}

function EditableField({
  label,
  icon: Icon,
  fieldKey,
  value,
  isTextArea = false,
  editingField,
  editValue,
  savingField,
  onChangeEditValue,
  onStartEdit,
  onCancelEdit,
  onSaveField,
}: EditableFieldProps) {
  const isEditing = editingField === fieldKey;
  const isSaving = savingField === String(fieldKey);

  return (
    <div className="flex flex-col gap-1 mb-3 group">
      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
      </span>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          {isTextArea ? (
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => onChangeEditValue(e.target.value)}
              className="text-xs text-slate-900 border border-[#7C3AED] rounded-lg p-2 outline-none w-full min-h-[80px] bg-white"
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) onSaveField(fieldKey); }}
            />
          ) : (
            <input
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => onChangeEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSaveField(fieldKey); }}
              className="text-xs text-slate-900 border border-[#7C3AED] rounded-lg px-2.5 py-1.5 outline-none w-full bg-white"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onSaveField(fieldKey)}
              disabled={isSaving}
              className="text-xs bg-[#7C3AED] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Salvar
            </button>
            <button onClick={onCancelEdit} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group/edit">
          <span className="text-xs font-semibold text-slate-800 break-words">
            {value || <span className="text-slate-400 italic">Não informado</span>}
          </span>
          <button
            onClick={() => onStartEdit(fieldKey, value || "")}
            className="text-slate-300 hover:text-[#7C3AED] opacity-0 group-hover/edit:opacity-100 transition-opacity p-0.5"
            title={`Editar ${label}`}
          >
            <Edit2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CandidateDrawer({
  isOpen,
  onClose,
  candidate,
  activeJob,
  onToggleShortlist,
  onMoveCandidate,
  onUpdateCandidate,
  onExportSuccess,
}: CandidateDrawerProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'geral' | 'criterios' | 'experiencia' | 'formacao' | 'mais'>('geral');

  // Local state for edits
  const [localCandidate, setLocalCandidate] = useState<Candidate | null>(null);

  // Edit mode states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingScoreIndex, setEditingScoreIndex] = useState<number | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(0);

  // Saving field state
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savingScore, setSavingScore] = useState<number | null>(null);

  // Rescore state
  const [isRescoring, setIsRescoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Etiquetas IA & Tags
  const [etiquetas, setEtiquetas] = useState<Array<{ id: string; nome: string; cor: string; posicao: number }>>([]);
  const [selectedEtiquetaId, setSelectedEtiquetaId] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Contact reveals
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [openShortlistDropdown, setOpenShortlistDropdown] = useState(false);
  const [canRevealContacts, setCanRevealContacts] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidateRafRef = useRef<number | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExportPdf = async () => {
    if (!localCandidate || isExporting) return;
    setIsExporting(true);

    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: localCandidate.id }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("success", "Exportação registrada com sucesso. Gerando PDF...");
        if (onExportSuccess) onExportSuccess();
        setTimeout(() => window.print(), 500);
      } else if (res.status === 403) {
        showToast("error", data.upgrade_message || "Limite de exportações atingido.");
      } else {
        showToast("error", data.error || "Erro ao exportar PDF.");
      }
    } catch {
      showToast("error", "Erro de conexão ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    async function loadPlanAccess() {
      try {
        const res = await fetch('/api/empresas', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const empresa = data?.empresa;
        setCanRevealContacts(shouldRevealContacts(empresa, false));
      } catch {
        setCanRevealContacts(true);
      }
    }

    loadPlanAccess();
  }, []);

  useEffect(() => {
    if (candidateRafRef.current !== null) {
      cancelAnimationFrame(candidateRafRef.current);
    }

    if (!candidate) {
      candidateRafRef.current = requestAnimationFrame(() => setLocalCandidate(null));
      return;
    }

    candidateRafRef.current = requestAnimationFrame(() => {
      setLocalCandidate({ ...candidate });
      setEditingField(null);
      setEditingScoreIndex(null);
      setShowRawText(false);
      setSelectedEtiquetaId(candidate.etiqueta?.id ?? null);
      setCustomTags(candidate.confirmedTags || []);
    });

    return () => {
      if (candidateRafRef.current !== null) cancelAnimationFrame(candidateRafRef.current);
    };
  }, [candidate]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Load etiquetas
  useEffect(() => {
    let mounted = true;
    async function loadEtiquetas() {
      try {
        const res = await fetch('/api/etiquetas', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && mounted) {
          setEtiquetas(data.etiquetas || []);
        }
      } catch {
        // ignore
      }
    }
    loadEtiquetas();
    return () => { mounted = false; };
  }, []);

  if (!isOpen || !localCandidate) return null;

  const bg = getAvatarBg(localCandidate.avatarColor);

  const recalculateScore = (evals: NonNullable<Candidate["evaluations"]>) => {
    if (!evals.length) return 0;
    let sumWeighted = 0;
    let sumWeights = 0;
    evals.forEach((ev) => {
      const w = ev.weight || 1;
      const val = ev.manualScore !== undefined && ev.manualScore !== null ? ev.manualScore : ev.score;
      sumWeighted += val * w;
      sumWeights += w;
    });
    return sumWeights > 0 ? sumWeighted / sumWeights : 0;
  };

  const handleSaveField = async (field: keyof Candidate) => {
    if (!localCandidate) return;
    setSavingField(String(field));

    try {
      const res = await fetch(`/api/candidates/${localCandidate.id}`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editValue }),
      });

      if (res.ok) {
        const updated = { ...localCandidate, [field]: editValue };
        setLocalCandidate(updated);
        if (onUpdateCandidate) onUpdateCandidate(updated);
        showToast("success", "Campo atualizado com sucesso.");
      } else {
        showToast("error", "Falha ao salvar alteração.");
      }
    } catch {
      showToast("error", "Erro de conexão ao salvar.");
    } finally {
      setSavingField(null);
      setEditingField(null);
    }
  };

  const handleSaveScore = async (index: number) => {
    if (!localCandidate || !localCandidate.evaluations) return;
    setSavingScore(index);

    const newEvals = [...localCandidate.evaluations];
    newEvals[index] = { ...newEvals[index], manualScore: editScoreValue };

    const newFinalScore = recalculateScore(newEvals);

    try {
      const res = await fetch(`/api/candidates/${localCandidate.id}`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluations: newEvals.map((ev) => ({
            name: ev.name,
            manualScore: ev.manualScore !== undefined ? ev.manualScore : null,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverScore = data.candidate?.score ?? newFinalScore;
        const updated = {
          ...localCandidate,
          evaluations: newEvals,
          score: serverScore,
        };
        setLocalCandidate(updated);
        if (onUpdateCandidate) onUpdateCandidate(updated);
        showToast("success", "Nota manual salva com sucesso.");
      } else {
        showToast("error", "Falha ao salvar nota manual.");
      }
    } catch {
      showToast("error", "Erro de conexão ao salvar nota.");
    } finally {
      setSavingScore(null);
      setEditingScoreIndex(null);
    }
  };

  const handleStartEdit = (field: keyof Candidate, value: string) => {
    setEditValue(value);
    setEditingField(String(field));
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleRescore = async () => {
    if (!localCandidate || isRescoring) return;
    setIsRescoring(true);

    try {
      const res = await fetch(`/api/candidates/${localCandidate.id}/rescore`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.score !== undefined) {
        const updatedEvals = data.evaluations || localCandidate.evaluations;
        const updated: Candidate = {
          ...localCandidate,
          name: data.name || localCandidate.name,
          score: data.score,
          evaluations: updatedEvals,
          initials: (data.name || localCandidate.name)
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .substring(0, 2)
            .toUpperCase(),
        };
        setLocalCandidate(updated);
        if (onUpdateCandidate) onUpdateCandidate(updated);
        showToast("success", "Score atualizado com sucesso pela IA!");
      } else if (res.status === 429) {
        showToast("error", "Limite atingido: 5 recálculos por minuto.");
      } else {
        showToast("error", data.error || "Falha ao recalcular o score com a IA.");
      }
    } catch {
      showToast("error", "Erro de conexão ao recalcular score.");
    } finally {
      setIsRescoring(false);
    }
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 4.5) return { text: "Compatibilidade Excelente", color: "text-emerald-600" };
    if (score >= 3.5) return { text: "Compatibilidade Alta", color: "text-[#7C3AED]" };
    if (score >= 2.5) return { text: "Compatibilidade Média", color: "text-amber-600" };
    return { text: "Compatibilidade Baixa", color: "text-rose-600" };
  };

  const compatibility = getCompatibilityLabel(localCandidate.score);

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const updated = [...customTags, newTagInput.trim()];
    setCustomTags(updated);
    setNewTagInput("");
    setIsAddingTag(false);
    showToast("success", "Nova tag adicionada!");
  };

  const handleRemoveTag = (tag: string) => {
    const updated = customTags.filter(t => t !== tag);
    setCustomTags(updated);
    showToast("success", `Tag "${tag}" removida.`);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity no-print" onClick={onClose} />

      {/* Drawer Container (Exact same layout & typography pattern as Busca Inteligente) */}
      <div className="fixed inset-y-0 right-0 w-[500px] max-w-full bg-white shadow-2xl z-50 transform transition-transform flex flex-col no-print border-l border-slate-200 font-sans">

        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-[520px] z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold transition-all duration-300 ${
              toast.type === "success"
                ? "bg-slate-900 text-white border border-slate-800"
                : "bg-rose-950 text-rose-100 border border-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ── HEADER SUPERIOR: Menu ⋮ + Fechar ✕ ── */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-end gap-1 bg-white flex-shrink-0 relative">
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center cursor-pointer"
              title="Mais opções"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <button 
                  onClick={() => { onToggleShortlist(localCandidate.id); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Star size={13} className="text-[#7C3AED]" />
                  <span>{localCandidate.shortlist ? "Remover da Shortlist" : "Salvar na Shortlist"}</span>
                </button>
                <button 
                  onClick={() => { handleRescore(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Sparkles size={13} className="text-purple-600" />
                  <span>Recalcular Score com IA</span>
                </button>
                <button 
                  onClick={() => { handleExportPdf(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium border-t border-slate-100"
                >
                  <Download size={13} className="text-slate-500" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── SEÇÃO HERO DO CANDIDATO ── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="font-bold text-[#111827] text-lg leading-tight truncate">{localCandidate.name}</h2>
                <span className="w-5 h-5 rounded bg-sky-50 text-sky-700 text-[9px] font-extrabold flex items-center justify-center border border-sky-200" title="Origem: PDF Resume">
                  PDF
                </span>
                <span className="w-4 h-4 rounded bg-slate-800 text-white text-[8px] font-bold flex items-center justify-center">X</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {localCandidate.city || "Paraná, Brasil"}
              </p>

              {/* Badges de Empresas/Cargos */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {localCandidate.company && (
                  <span className="px-3 py-1 bg-purple-50 text-[#7C3AED] rounded-full text-xs font-semibold border border-purple-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    {localCandidate.company}
                  </span>
                )}
                {localCandidate.role && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                    {localCandidate.role}
                  </span>
                )}
              </div>
            </div>

            {/* Avatar Circle */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: bg, color: localCandidate.avatarColor }}
            >
              {localCandidate.initials}
            </div>
          </div>

          {/* Primary Actions Row */}
          <div className="flex items-center gap-2 mt-4 relative">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-xs relative">
              <button
                onClick={() => onToggleShortlist(localCandidate.id)}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 transition-colors cursor-pointer ${
                  localCandidate.shortlist ? 'bg-purple-50 text-[#7C3AED]' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${
                  localCandidate.shortlist ? 'bg-[#7C3AED]' : 'border border-slate-400'
                }`} />
                {localCandidate.shortlist ? 'Shortlisted' : 'Add to Shortlist'}
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={() => setOpenShortlistDropdown(!openShortlistDropdown)}
                className="px-2 py-2 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronDown size={13} className="text-slate-400" />
              </button>
            </div>

            {/* Dropdown menu do Add to Shortlist */}
            {openShortlistDropdown && (
              <div className="absolute left-0 top-11 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { onToggleShortlist(localCandidate.id); setOpenShortlistDropdown(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 font-medium"
                >
                  <Star size={12} className="text-[#7C3AED]" />
                  <span>{localCandidate.shortlist ? "Remover da Shortlist" : "Salvar na Shortlist"}</span>
                </button>
                <button
                  onClick={() => {
                    onMoveCandidate(localCandidate.id, "entrevista");
                    showToast("success", "Status alterado para Entrevista");
                    setOpenShortlistDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 font-medium border-t border-slate-100"
                >
                  <UserPlus size={12} className="text-slate-500" />
                  <span>Mover para Entrevista</span>
                </button>
              </div>
            )}

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex-1 bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-semibold text-[12px] px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* ── NAVEGAÇÃO POR ABAS (Padrão Busca Inteligente) ── */}
        <div className="flex border-b border-slate-200 bg-white px-6 flex-shrink-0 overflow-x-auto">
          {[
            { key: 'geral', label: 'Visão Geral' },
            { key: 'criterios', label: 'Critérios & Score' },
            { key: 'experiencia', label: 'Experiência' },
            { key: 'formacao', label: 'Formação' },
            { key: 'mais', label: 'Mais' },
          ].map((tb) => (
            <button
              key={tb.key}
              onClick={() => setDrawerTab(tb.key as typeof drawerTab)}
              className={`py-3 px-3 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                drawerTab === tb.key
                  ? 'border-[#7C3AED] text-[#7C3AED] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── CONTEÚDO DAS ABAS (ROLÁVEL) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── ABA 1: VISÃO GERAL ── */}
          {drawerTab === 'geral' && (
            <div className="space-y-0 divide-y divide-slate-100">
              
              {/* Status do Pipeline */}
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                  </span>
                  Status no Pipeline
                </span>
                <select
                  value={localCandidate.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as KanbanStatus;
                    const updated = { ...localCandidate, status: newStatus };
                    setLocalCandidate(updated);
                    if (onUpdateCandidate) onUpdateCandidate(updated);
                    onMoveCandidate(localCandidate.id, newStatus);
                    showToast("success", `Status alterado para "${newStatus}"`);
                  }}
                  className="text-[12px] font-semibold text-[#7C3AED] bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-purple-100 transition-colors uppercase tracking-wide"
                >
                  <option value="triado">Triado</option>
                  <option value="shortlist">Shortlist</option>
                  <option value="entrevista">Entrevista</option>
                  <option value="oferecido">Oferecido</option>
                  <option value="contratado">Contratado</option>
                </select>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  E-mail
                </span>
                {revealedContacts.has(`${localCandidate.id}-email`) || localCandidate.email || canRevealContacts ? (
                  <span className="text-[12px] text-slate-800 font-medium select-all">
                    {localCandidate.email || (canRevealContacts ? 'contato@email.com' : 'Acesso restrito no plano atual')}
                  </span>
                ) : (
                  <button 
                    onClick={() => setRevealedContacts(prev => new Set(prev).add(`${localCandidate.id}-email`))}
                    className="text-[12px] text-[#7C3AED] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Revelar e-mail +
                  </button>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  Telefone
                </span>
                {revealedContacts.has(`${localCandidate.id}-phone`) || localCandidate.phone || canRevealContacts ? (
                  <span className="text-[12px] text-slate-800 font-medium select-all">
                    {localCandidate.phone || (canRevealContacts ? '+55 (41) 99888-7766' : 'Acesso restrito no plano atual')}
                  </span>
                ) : (
                  <button 
                    onClick={() => setRevealedContacts(prev => new Set(prev).add(`${localCandidate.id}-phone`))}
                    className="text-[12px] text-[#7C3AED] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Revelar número +
                  </button>
                )}
              </div>

              {/* Tags Interativas */}
              <div className="flex items-start justify-between py-3 gap-4">
                <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-400">◇</span>
                  Tags / Etiquetas
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end items-center">
                  {customTags.map((sk, i) => (
                    <span key={i} className="text-[11px] text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5 flex items-center gap-1 font-medium">
                      {sk}
                      <button
                        onClick={() => handleRemoveTag(sk)}
                        className="text-slate-400 hover:text-rose-500 font-bold text-xs"
                        title="Remover tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag();
                          if (e.key === 'Escape') setIsAddingTag(false);
                        }}
                        placeholder="Nova tag..."
                        className="text-[11px] px-2 py-0.5 border border-[#7C3AED] rounded-full outline-none w-24 bg-white"
                      />
                      <button
                        onClick={handleAddTag}
                        className="text-[11px] font-bold text-white bg-[#7C3AED] px-2 py-0.5 rounded-full"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="text-[12px] text-[#7C3AED] font-semibold hover:underline cursor-pointer"
                    >
                      + Adicionar tag
                    </button>
                  )}
                </div>
              </div>

              {/* Resumo de Compatibilidade da IA */}
              <div className="pt-4 pb-2">
                <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#7C3AED]" /> Score de Compatibilidade
                    </span>
                    <span className="text-xs font-extrabold text-[#7C3AED] bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      {localCandidate.score.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${compatibility.color}`}>
                    {compatibility.text}
                  </p>
                  {localCandidate.aiSummary && (
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-white/80 p-2.5 rounded-xl border border-purple-100/50">
                      "{localCandidate.aiSummary}"
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── ABA 2: CRITÉRIOS & SCORE (Específica do PDF Ranker) ── */}
          {drawerTab === 'criterios' && (
            <div className="space-y-6">
              
              {/* Score Hero Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center relative bg-purple-50 border border-purple-100">
                    <span className="text-2xl font-black text-[#7C3AED]">{localCandidate.score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Score Final Ponderado</span>
                    <span className={`text-xs font-semibold mt-0.5 ${compatibility.color}`}>{compatibility.text}</span>
                  </div>
                </div>

                <button
                  onClick={handleRescore}
                  disabled={isRescoring}
                  className="text-xs text-[#7C3AED] font-bold hover:bg-purple-50 px-3 py-2 rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isRescoring ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Recalcular IA</span>
                </button>
              </div>

              {/* Lista de Avaliações por Critério */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#7C3AED]" />
                  Avaliação Detalhada por Critério
                </h3>

                {(localCandidate.evaluations || [
                  { name: "Avaliação geral do documento", score: localCandidate.score, justification: "Nota calculada com base na estrutura geral do CV.", weight: 1 }
                ]).map((ev, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-snug">{ev.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                            Peso {ev.weight || 1}
                          </span>
                          {ev.manualScore !== undefined && ev.manualScore !== null && (
                            <span className="text-[10px] text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-semibold">
                              Nota manual ajustada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Slider de Edição ou Exibição da Nota */}
                      {editingScoreIndex === i ? (
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <input
                            type="range" min="1" max="5" step="0.1"
                            value={editScoreValue}
                            onChange={(e) => setEditScoreValue(parseFloat(e.target.value))}
                            className="w-20 accent-[#7C3AED]"
                          />
                          <span className="text-xs font-bold w-6 text-center text-slate-800">{editScoreValue.toFixed(1)}</span>
                          <button
                            onClick={() => handleSaveScore(i)}
                            disabled={savingScore === i}
                            className="p-1 bg-[#7C3AED] text-white rounded-lg hover:opacity-90 disabled:opacity-60"
                          >
                            {savingScore === i ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button onClick={() => setEditingScoreIndex(null)} className="p-1 bg-slate-200 text-slate-700 rounded-lg">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-[#7C3AED]">
                            {ev.manualScore !== undefined && ev.manualScore !== null
                              ? ev.manualScore.toFixed(1)
                              : ev.score.toFixed(1)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingScoreIndex(i);
                              setEditScoreValue(ev.manualScore !== undefined && ev.manualScore !== null ? ev.manualScore : ev.score);
                            }}
                            className="p-1 text-slate-300 hover:text-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ajustar nota manual"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {ev.justification && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-normal">
                        {ev.justification}
                      </p>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ── ABA 3: EXPERIÊNCIA ── */}
          {drawerTab === 'experiencia' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#7C3AED]" /> Histórico de Experiências
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Extraído via IA</span>
              </div>

              {/* Vertical Timeline connected design */}
              <div className="relative pl-6 border-l border-slate-200 space-y-4 ml-2">
                {localCandidate.role ? (
                  <div className="relative flex flex-col gap-1 text-xs">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[9px] shadow-xs">
                      01
                    </div>
                    <span className="font-bold text-slate-900">{localCandidate.role}</span>
                    <span className="text-slate-600 font-medium">{localCandidate.company || "Empresa no CV"}</span>
                    <span className="text-[11px] text-slate-400">Período recente extraído</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhuma experiência formal listada no documento.</p>
                )}
              </div>
            </div>
          )}

          {/* ── ABA 4: FORMAÇÃO & COMPETÊNCIAS ── */}
          {drawerTab === 'formacao' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  🎓 Formação Acadêmica
                </h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700">
                  {localCandidate.formacao || "Ensino Superior / Técnico extraído do CV"}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  ⚡ Competências Técnicas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(localCandidate.confirmedTags || []).concat(localCandidate.partialTags || []).map((sk, i) => (
                    <span key={i} className="text-xs text-[#7C3AED] bg-purple-50 border border-purple-100 rounded-full px-3 py-1 font-semibold">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ABA 5: MAIS (Campos editáveis, notas, texto do CV, vagas) ── */}
          {drawerTab === 'mais' && (
            <div className="space-y-6">
              
              {/* Informações Pessoais Editáveis */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <User size={13} className="text-slate-400" /> Informações Editáveis
                </h4>
                <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <EditableField label="Pretensão Salarial" icon={CircleDollarSign} fieldKey="pretensaoSalarial" value={localCandidate.pretensaoSalarial}
                    editingField={editingField} editValue={editValue} savingField={savingField}
                    onChangeEditValue={setEditValue} onStartEdit={handleStartEdit} onCancelEdit={handleCancelEdit} onSaveField={handleSaveField} />
                  <EditableField label="Disponibilidade" icon={Calendar} fieldKey="disponibilidade" value={localCandidate.disponibilidade}
                    editingField={editingField} editValue={editValue} savingField={savingField}
                    onChangeEditValue={setEditValue} onStartEdit={handleStartEdit} onCancelEdit={handleCancelEdit} onSaveField={handleSaveField} />
                  <EditableField label="Observações do Recrutador" icon={FileText} fieldKey="observacoes" value={localCandidate.observacoes} isTextArea={true}
                    editingField={editingField} editValue={editValue} savingField={savingField}
                    onChangeEditValue={setEditValue} onStartEdit={handleStartEdit} onCancelEdit={handleCancelEdit} onSaveField={handleSaveField} />
                </div>
              </div>

              {/* Texto Bruto Extraído do PDF */}
              <div>
                <button 
                  onClick={() => setShowRawText(!showRawText)}
                  className="flex items-center justify-between w-full text-left font-bold text-xs text-slate-900 py-2 border-t border-slate-100 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCode size={14} className="text-slate-400" /> Texto Bruto Extraído do PDF
                  </span>
                  {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showRawText && (
                  <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                    {localCandidate.parsedText || "Texto não disponível para este arquivo."}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
