"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Candidate, Job, KanbanStatus } from "@/lib/types";
import { getAvatarBg } from "@/lib/mock-data";
import { shouldRevealContacts } from "@/lib/planos";
import {
  X, ExternalLink, Star, ChevronDown, MapPin,
  Mail, Phone, CircleDollarSign, Calendar, FileText, Edit2, Check,
  CheckCircle2, LucideIcon, Loader2, AlertCircle, Sparkles, Download,
  MoreVertical, UserPlus, Send, AtSign, Clock, RefreshCw, Layers,
  Copy, ShieldCheck, Video, UserCheck, AlertTriangle
} from "lucide-react";
import MeetingsSchedulerModal from "@/components/MeetingsSchedulerModal";

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

interface TimelineEntry {
  id: string;
  type: "email" | "note" | "status_change" | "ai_enrich";
  title: string;
  content: string;
  timestamp: string;
  author?: string;
}

const TEAM_MENTIONS = [
  { handle: "@recrutador", name: "Recrutador Responsável" },
  { handle: "@mateus", name: "Mateus Rodrigues (ADM)" },
  { handle: "@rh", name: "Equipe RH & People" },
  { handle: "@diretor", name: "Diretor da Área" },
];

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
  const [drawerTab, setDrawerTab] = useState<'linha_tempo' | 'geral' | 'criterios' | 'experiencia' | 'formacao'>('linha_tempo');
  const [localCandidate, setLocalCandidate] = useState<Candidate | null>(null);

  // Edit mode states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingScoreIndex, setEditingScoreIndex] = useState<number | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<number>(0);
  const [savingField, setSavingField] = useState<string | null>(null);

  // AI & Export states
  const [isRescoring, setIsRescoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Tags & Labels
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Contact reveals & Dropdowns
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [openShortlistDropdown, setOpenShortlistDropdown] = useState(false);
  const [canRevealContacts, setCanRevealContacts] = useState(true);

  // Meetings Scheduler Modal
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // Interactive Timeline state & @mentions
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  // Data Hub Logic (Deduplication & ATS Sync)
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [dedupResolved, setDedupResolved] = useState(false);
  const [atsSync, setAtsSync] = useState({
    greenhouse: "Sincronizado",
    lever: "Sincronizado",
    gupy: "Pendente",
    workday: "Sincronizado",
  });

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Initialize candidate & mock timeline on load
  useEffect(() => {
    if (!candidate) {
      setLocalCandidate(null);
      return;
    }

    setLocalCandidate({ ...candidate });
    setCustomTags(candidate.confirmedTags || []);
    setIsDuplicate(Boolean(candidate.email?.includes("mateus") || candidate.name.toLowerCase().includes("mateus")));

    // Mock initial activity timeline
    const initialTimeline: TimelineEntry[] = [
      {
        id: "t-1",
        type: "status_change",
        title: "Entrada no Pipeline",
        content: `Candidato importado e classificado na etapa "${candidate.status || 'triado'}".`,
        timestamp: candidate.createdAt
          ? new Date(candidate.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
          : "Hoje às 10:15",
        author: "Sistema IA RankHire",
      },
      {
        id: "t-2",
        type: "email",
        title: "E-mail de Apresentação Enviado",
        content: `Subject: Oportunidade para ${candidate.role || 'Desenvolvedor'} na RankHire BR`,
        timestamp: "Ontem às 16:40",
        author: "Mateus Rodrigues",
      },
      {
        id: "t-3",
        type: "note",
        title: "Nota Interna",
        content: "Ótimo fit técnico. Mencionei @recrutador para agendar a entrevista inicial.",
        timestamp: "Hoje às 11:00",
        author: "Mateus Rodrigues",
      },
    ];
    setTimelineEntries(initialTimeline);
  }, [candidate]);

  useEffect(() => {
    async function loadPlanAccess() {
      try {
        const res = await fetch('/api/empresas', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setCanRevealContacts(shouldRevealContacts(data?.empresa, false));
      } catch {
        setCanRevealContacts(true);
      }
    }
    loadPlanAccess();
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim() || !localCandidate) return;
    const entry: TimelineEntry = {
      id: `note-${Date.now()}`,
      type: "note",
      title: "Nota Interna com Mentions",
      content: newNote.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      author: "Você (Recrutador)",
    };
    setTimelineEntries((prev) => [entry, ...prev]);
    setNewNote("");
    setShowMentionSuggestions(false);
    showToast("success", "Nota salva na linha do tempo!");
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewNote(val);
    if (val.endsWith("@") || val.includes("@")) {
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (handle: string) => {
    const parts = newNote.split("@");
    parts.pop();
    const updated = parts.join("@") + handle + " ";
    setNewNote(updated);
    setShowMentionSuggestions(false);
    if (noteInputRef.current) noteInputRef.current.focus();
  };

  // Enriquecer Perfil via IA
  const handleAiEnrichment = async () => {
    if (!localCandidate || isEnriching) return;
    setIsEnriching(true);

    setTimeout(() => {
      setIsEnriching(false);
      const enrichedSummary = localCandidate.aiSummary
        ? `${localCandidate.aiSummary} • [Enriquecido via IA: Forte potencial de liderança técnica e alta adaptabilidade.]`
        : "Perfil enriquecido via IA RankHire: Profissional com vivência sólida em projetos de alto impacto, domínio técnico avançado e rápida curva de aprendizado.";

      const updated: Candidate = {
        ...localCandidate,
        aiSummary: enrichedSummary,
        confirmedTags: Array.from(new Set([...customTags, "IA Enriquecida", "High Potential"])),
      };

      setLocalCandidate(updated);
      setCustomTags(updated.confirmedTags);

      const entry: TimelineEntry = {
        id: `enrich-${Date.now()}`,
        type: "ai_enrich",
        title: "Enriquecimento de Perfil via IA",
        content: "Dados adicionais de carreira, skills recomendadas e análise comportamental foram gerados.",
        timestamp: "Agora mesmo",
        author: "Agente IA RankHire",
      };
      setTimelineEntries((prev) => [entry, ...prev]);
      if (onUpdateCandidate) onUpdateCandidate(updated);
      showToast("success", "Perfil enriquecido com sucesso pela IA!");
    }, 2000);
  };

  // Confirm Interview Schedule
  const handleConfirmSchedule = (candId: string, date: string, time: string) => {
    if (!localCandidate) return;
    const updated: Candidate = { ...localCandidate, status: "entrevista" };
    setLocalCandidate(updated);
    if (onUpdateCandidate) onUpdateCandidate(updated);
    onMoveCandidate(candId, "entrevista");

    const entry: TimelineEntry = {
      id: `meet-${Date.now()}`,
      type: "status_change",
      title: "Entrevista Agendada (Meetings Hub)",
      content: `Entrevista técnica confirmada para ${date} às ${time} hs via link rankhire.app/meet/recrutador. Status atualizado para Entrevista.`,
      timestamp: "Agora",
      author: "Meetings Scheduler",
    };
    setTimelineEntries((prev) => [entry, ...prev]);
    showToast("success", "Entrevista agendada! Status atualizado para Entrevista.");
  };

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
      } else {
        showToast("error", data.error || "Erro ao exportar PDF.");
      }
    } catch {
      showToast("error", "Erro de conexão ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !localCandidate) return null;

  const bg = getAvatarBg(localCandidate.avatarColor);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity no-print"
            onClick={onClose}
          />

          {/* Sliding Drawer */}
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-[540px] max-w-full bg-white shadow-2xl z-50 flex flex-col no-print border-l border-slate-200 font-sans"
          >
            {/* Toast Notification */}
            {toast && (
              <div
                className={`fixed bottom-6 right-[560px] z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold transition-all duration-300 ${
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

            {/* Header Superior */}
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0 relative">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Candidato 360° Hub
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsSchedulerOpen(true)}
                  className="px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" /> Agendar Entrevista
                </button>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
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
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hero Candidato Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="font-bold text-[#111827] text-lg leading-tight truncate">{localCandidate.name}</h2>
                    <span className="w-5 h-5 rounded bg-sky-50 text-sky-700 text-[9px] font-extrabold flex items-center justify-center border border-sky-200">
                      PDF
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {localCandidate.city || "Paraná, Brasil"}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {localCandidate.company && (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-[#7C3AED] rounded-full text-[11px] font-semibold border border-purple-100">
                        {localCandidate.company}
                      </span>
                    )}
                    {localCandidate.role && (
                      <span className="px-2.5 py-0.5 bg-white text-slate-700 rounded-full text-[11px] font-medium border border-slate-200">
                        {localCandidate.role}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: bg, color: localCandidate.avatarColor }}
                >
                  {localCandidate.initials}
                </div>
              </div>

              {/* Data Hub Badges Row (Deduplication & ATS Sync) */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                {/* Deduplication status */}
                {isDuplicate && !dedupResolved ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Perfil duplicado detectado (LinkedIn ID)</span>
                    <button
                      onClick={() => {
                        setDedupResolved(true);
                        showToast("success", "Perfis mesclados e deduplicados com sucesso.");
                      }}
                      className="ml-1 bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-amber-700 transition"
                    >
                      Mesclar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Deduplicado (Único na base)
                  </div>
                )}

                {/* ATS Sync Badges */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className="text-slate-400">ATS:</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Greenhouse 🟢
                  </span>
                  <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                    Workday 🔵
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 flex-shrink-0 overflow-x-auto">
              {[
                { key: 'linha_tempo', label: '⚡ Timeline & Atividades' },
                { key: 'geral', label: 'Visão Geral' },
                { key: 'criterios', label: 'Critérios & Score' },
                { key: 'experiencia', label: 'Experiência' },
                { key: 'formacao', label: 'Formação' },
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

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* ABA 1: TIMELINE DE ATIVIDADES 360° */}
              {drawerTab === 'linha_tempo' && (
                <div className="space-y-5">
                  {/* AI Enrichment Action Header */}
                  <div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Enriquecer Perfil com IA
                      </h4>
                      <p className="text-[11px] text-slate-500">Analisa histórico, extrai novas competências e gera inteligência.</p>
                    </div>
                    <button
                      onClick={handleAiEnrichment}
                      disabled={isEnriching}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Enriquecer
                    </button>
                  </div>

                  {/* Add Note with @Mentions Box */}
                  <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Adicionar Nota Interna</span>
                      <span className="text-[10px] text-slate-400 font-normal">Suporta @mentions</span>
                    </label>

                    <textarea
                      ref={noteInputRef}
                      value={newNote}
                      onChange={handleNoteChange}
                      placeholder="Escreva uma nota... Digite @ para mencionar equipe"
                      className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 min-h-[70px] resize-none"
                    />

                    {/* @Mentions Popover Suggestions */}
                    {showMentionSuggestions && (
                      <div className="absolute left-3 bottom-14 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">
                        <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Mencionar Integrante</p>
                        {TEAM_MENTIONS.map((m) => (
                          <button
                            key={m.handle}
                            type="button"
                            onClick={() => insertMention(m.handle)}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-violet-50 text-slate-700 font-medium flex items-center justify-between"
                          >
                            <span className="font-semibold text-violet-700">{m.handle}</span>
                            <span className="text-[10px] text-slate-400">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Salvar Nota
                      </button>
                    </div>
                  </div>

                  {/* Interactive Timeline List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Histórico de Atividades
                    </h4>

                    <div className="relative pl-5 space-y-4 border-l-2 border-slate-200">
                      {timelineEntries.map((item) => (
                        <div key={item.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            item.type === "email" ? "bg-sky-500" : item.type === "note" ? "bg-violet-500" : item.type === "ai_enrich" ? "bg-amber-500" : "bg-emerald-500"
                          }`} />

                          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-800">{item.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">
                              {item.content}
                            </p>
                            {item.author && (
                              <p className="mt-1.5 text-[10px] font-semibold text-slate-400">Por {item.author}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: VISÃO GERAL */}
              {drawerTab === 'geral' && (
                <div className="space-y-4 divide-y divide-slate-100">
                  {/* Status no Pipeline */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
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
                      className="text-[12px] font-semibold text-[#7C3AED] bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1 outline-none uppercase"
                    >
                      <option value="triado">Triado</option>
                      <option value="shortlist">Shortlist</option>
                      <option value="entrevista">Entrevista</option>
                      <option value="oferecido">Oferecido</option>
                      <option value="contratado">Contratado</option>
                    </select>
                  </div>

                  {/* Email & Phone */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" /> E-mail
                    </span>
                    <span className="text-[12px] text-slate-800 font-medium select-all">
                      {localCandidate.email || "candidato@email.com"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> Telefone
                    </span>
                    <span className="text-[12px] text-slate-800 font-medium select-all">
                      {localCandidate.phone || "+55 (41) 99888-7766"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="py-2">
                    <span className="text-[12px] text-slate-500 font-medium block mb-2">Tags / Etiquetas IA</span>
                    <div className="flex flex-wrap gap-1.5">
                      {customTags.map((t, idx) => (
                        <span key={idx} className="text-[11px] text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Summary */}
                  {localCandidate.aiSummary && (
                    <div className="py-3 bg-violet-50/50 p-3 rounded-xl border border-violet-100">
                      <span className="text-[11px] font-bold text-violet-800 block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Resumo IA Executive
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {localCandidate.aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: CRITÉRIOS & SCORE */}
              {drawerTab === 'criterios' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 font-medium">Fit Score Geral</span>
                    <p className="text-3xl font-black text-violet-700 mt-1">{localCandidate.score.toFixed(1)} / 5.0</p>
                  </div>

                  {localCandidate.evaluations && localCandidate.evaluations.length > 0 ? (
                    <div className="space-y-3">
                      {localCandidate.evaluations.map((ev, i) => (
                        <div key={i} className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-800">{ev.name}</span>
                            <span className="text-violet-700 font-bold">{ev.score.toFixed(1)} / 5.0</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{ev.justification}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum critério detalhado disponível.</p>
                  )}
                </div>
              )}

              {/* ABA 4: EXPERIÊNCIA */}
              {drawerTab === 'experiencia' && (
                <div className="space-y-3">
                  <div className="p-3 border border-slate-200 rounded-xl bg-white">
                    <p className="text-xs font-bold text-slate-800">{localCandidate.role}</p>
                    <p className="text-xs text-violet-600 font-medium">{localCandidate.company}</p>
                    <p className="text-[11px] text-slate-400 mt-1">2021 - Atual · Paraná, Brasil</p>
                  </div>
                </div>
              )}

              {/* ABA 5: FORMAÇÃO */}
              {drawerTab === 'formacao' && (
                <div className="space-y-3">
                  <div className="p-3 border border-slate-200 rounded-xl bg-white">
                    <p className="text-xs font-bold text-slate-800">Bacharelado em Ciência da Computação</p>
                    <p className="text-xs text-slate-500">Universidade Federal · 2017 - 2021</p>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}

      {/* Meetings Scheduler Modal */}
      <MeetingsSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        candidate={localCandidate}
        onConfirmSchedule={handleConfirmSchedule}
      />
    </AnimatePresence>
  );
}
