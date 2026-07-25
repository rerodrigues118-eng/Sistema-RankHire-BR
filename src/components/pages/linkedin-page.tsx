"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Candidate, Job } from "@/lib/types";
import { AVATAR_COLORS } from "@/lib/mock-data";
import {
  RefreshCw, ExternalLink, Plus, AlertCircle, SlidersHorizontal,
  Sparkles, Eye, EyeOff, ArrowUp, X, Pencil, Check, ChevronDown,
  ChevronUp, Database, Zap, Filter
} from "lucide-react";
import AdvancedFiltersDrawer, { type AdvancedSearchFilters } from "../AdvancedFiltersDrawer";
import LinkedinPreviewDrawer, { type LinkedinProfile } from "../LinkedinPreviewDrawer";

interface LinkedinPageProps {
  activeJob: Job;
  onImportCandidate: (candidate: Candidate) => void;
}

interface Criterio {
  id: string;
  nome: string;
  descricao: string;
  peso: number;
}

interface FilterTags {
  job_titles?: string[];
  location?: string;
  keywords?: string[];
  booleanExpr?: string;
  minYears?: string;
  maxYears?: string;
  idiomas?: string[];
}

interface ChatMessage {
  id: string;
  type: "user" | "ai-loading" | "ai-criterios" | "ai-results" | "ai-error";
  content?: string;
  criterios?: Criterio[];
  filtros?: FilterTags;
  results?: LinkedinProfile[];
  source?: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "??";
}

function ScoreGauge({ score, size = 44 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - ((score - 1) / 4));
  const color = score >= 4 ? "#10b981" : score >= 3 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

async function scoreCandidatesInBatches(profiles: LinkedinProfile[], criterios: Criterio[]) {
  const BATCH = 5;
  const out = [...profiles];
  for (let i = 0; i < profiles.length; i += BATCH) {
    const batch = profiles.slice(i, i + BATCH);
    const scored = await Promise.all(batch.map(async (p) => {
      try {
        const res = await fetch("/api/candidate-scoring", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criterios, perfil: p })
        });
        if (!res.ok) return p;
        const d = await res.json();
        return { ...p, score_final: d.score_final, criterios_avaliados: d.criterios, resumo: d.resumo || p.resumo };
      } catch { return p; }
    }));
    scored.forEach((p, bi) => { out[i + bi] = p; });
    if (i + BATCH < profiles.length) await new Promise(r => setTimeout(r, 500));
  }
  return out;
}

const SUGESTOES = [
  "Designer de Email com Figma, ingles fluente, agencias digitais",
  "Dev React Senior, fintech, 5+ anos, Sao Paulo",
  "Gerente de Vendas B2B, SaaS, Sul do Brasil",
  "Analista de Marketing Digital, SEO, e-commerce",
];

function hasActiveFilters(filters: Record<string, unknown>): boolean {
  return Object.keys(filters).some(k => {
    const v = filters[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
}
function CriterioCard({
  criterio, onChangePeso, onRemove, onChangeNome,
}: {
  criterio: Criterio;
  onChangePeso: (id: string, peso: number) => void;
  onRemove: (id: string) => void;
  onChangeNome: (id: string, nome: string) => void;
}) {
  const [editingNome, setEditingNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState(criterio.nome);
  const pesoColors: Record<number, string> = {
    1: "bg-gray-100 text-gray-500",
    2: "bg-blue-50 text-blue-500",
    3: "bg-amber-50 text-amber-600",
    4: "bg-orange-50 text-orange-600",
    5: "bg-indigo-100 text-indigo-700",
  };
  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl px-3 py-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      <button onClick={() => onRemove(criterio.id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-1.5 mb-2">
        {[1, 2, 3, 4, 5].map(p => (
          <button key={p} onClick={() => onChangePeso(criterio.id, p)}
            className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all ${criterio.peso === p ? pesoColors[p] + " ring-1 ring-offset-1 ring-current" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}>
            {p}
          </button>
        ))}
        <div className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${pesoColors[criterio.peso]}`}>P{criterio.peso}</div>
      </div>
      {editingNome ? (
        <div className="flex items-center gap-1">
          <input autoFocus value={nomeTemp} onChange={e => setNomeTemp(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { onChangeNome(criterio.id, nomeTemp); setEditingNome(false); }
              if (e.key === "Escape") { setNomeTemp(criterio.nome); setEditingNome(false); }
            }}
            className="flex-1 text-[12px] font-semibold text-gray-800 bg-indigo-50 rounded px-1.5 py-0.5 outline-none border border-indigo-200" />
          <button onClick={() => { onChangeNome(criterio.id, nomeTemp); setEditingNome(false); }} className="text-indigo-600">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 group/nome">
          <p className="text-[12px] font-semibold text-gray-800 leading-tight flex-1">{criterio.nome}</p>
          <button onClick={() => { setNomeTemp(criterio.nome); setEditingNome(true); }}
            className="opacity-0 group-hover/nome:opacity-100 transition-opacity text-gray-300 hover:text-indigo-500">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
      <p className="text-[10.5px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{criterio.descricao}</p>
    </div>
  );
}

function FilterTagChip({ label, onRemove, color = "indigo" }: { label: string; onRemove: () => void; color?: "indigo" | "gray" | "emerald" }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorMap[color]}`}>
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
    </span>
  );
}

function CriteriosInterativos({ msg, onRunSearch, isSearching }: {
  msg: ChatMessage;
  onRunSearch: (filtros: FilterTags, crits: Criterio[]) => void;
  isSearching: boolean;
}) {
  const [crits, setCrits] = useState<Criterio[]>(msg.criterios || []);
  const [filtros, setFiltros] = useState<FilterTags>(msg.filtros || {});
  const [newKeyword, setNewKeyword] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [expanded, setExpanded] = useState(true);

  const handleChangePeso = (id: string, peso: number) => setCrits(prev => prev.map(c => c.id === id ? { ...c, peso } : c));
  const handleRemoveCriterio = (id: string) => setCrits(prev => prev.filter(c => c.id !== id));
  const handleChangeNome = (id: string, nome: string) => setCrits(prev => prev.map(c => c.id === id ? { ...c, nome } : c));
  const addKeyword = () => { if (!newKeyword.trim()) return; setFiltros(prev => ({ ...prev, keywords: [...(prev.keywords || []), newKeyword.trim()] })); setNewKeyword(""); };
  const addTitle = () => { if (!newTitle.trim()) return; setFiltros(prev => ({ ...prev, job_titles: [...(prev.job_titles || []), newTitle.trim()] })); setNewTitle(""); };

  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[90%] space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-600">
            Identifiquei <strong className="text-gray-900">{crits.length} criterios</strong> e{" "}
            <strong className="text-gray-900">{(filtros.job_titles?.length || 0) + (filtros.keywords?.length || 0)} filtros</strong>.{" "}
            Edite abaixo antes de buscar.
          </p>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {expanded && (
          <>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Criterios de Avaliacao</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {crits.map(c => (
                  <CriterioCard key={c.id} criterio={c} onChangePeso={handleChangePeso} onRemove={handleRemoveCriterio} onChangeNome={handleChangeNome} />
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 space-y-3 border border-gray-100">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />Filtros de Busca
              </p>
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Cargos</p>
                <div className="flex flex-wrap gap-1.5">
                  {(filtros.job_titles || []).map((t, i) => (
                    <FilterTagChip key={i} label={t} color="indigo"
                      onRemove={() => setFiltros(prev => ({ ...prev, job_titles: prev.job_titles?.filter((_, idx) => idx !== i) }))} />
                  ))}
                  <div className="flex items-center gap-1">
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addTitle()}
                      placeholder="+ cargo"
                      className="text-[11px] border border-dashed border-gray-300 rounded-full px-2 py-0.5 outline-none w-24 text-gray-600 focus:border-indigo-400 focus:bg-white" />
                    {newTitle && <button onClick={addTitle} className="text-indigo-600"><Check className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5">Palavras-chave</p>
                <div className="flex flex-wrap gap-1.5">
                  {(filtros.keywords || []).map((k, i) => (
                    <FilterTagChip key={i} label={k} color="gray"
                      onRemove={() => setFiltros(prev => ({ ...prev, keywords: prev.keywords?.filter((_, idx) => idx !== i) }))} />
                  ))}
                  <div className="flex items-center gap-1">
                    <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()}
                      placeholder="+ keyword"
                      className="text-[11px] border border-dashed border-gray-300 rounded-full px-2 py-0.5 outline-none w-24 text-gray-600 focus:border-indigo-400 focus:bg-white" />
                    {newKeyword && <button onClick={addKeyword} className="text-indigo-600"><Check className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
              {filtros.location && (
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400">Local:</p>
                  <FilterTagChip label={"📍 " + filtros.location} color="emerald"
                    onRemove={() => setFiltros(prev => ({ ...prev, location: "" }))} />
                </div>
              )}
            </div>
          </>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => onRunSearch(filtros, crits)} disabled={isSearching}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSearching
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Buscando...</>
              : <><Sparkles className="w-3.5 h-3.5" />Buscar com esses criterios</>}
          </button>
          <span className="text-[11px] text-gray-400">{crits.length} criterios</span>
        </div>
      </div>
    </div>
  );
}
export default function LinkedinPage({ activeJob, onImportCandidate }: LinkedinPageProps) {
  const CHAT_STORAGE_KEY = `rh_chat_${activeJob?.id || "default"}`;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`rh_chat_${activeJob?.id || "default"}`);
      if (saved) return JSON.parse(saved) as ChatMessage[];
    } catch { /* ignore */ }
    return [];
  });
  const [hasStarted, setHasStarted] = useState(() => {
    try {
      const saved = localStorage.getItem(`rh_chat_${activeJob?.id || "default"}`);
      if (saved) { const parsed = JSON.parse(saved) as ChatMessage[]; return parsed.length > 0; }
    } catch { /* ignore */ }
    return false;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});
  const setAdvancedFilters = (f: AdvancedSearchFilters) => setActiveFilters(f as unknown as Record<string, unknown>);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<LinkedinProfile | null>(null);
  const [urlsVistas, setUrlsVistas] = useState<Set<string>>(new Set());
  const [ocultarVistos, setOcultarVistos] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const userMsgs = messages.filter(m => m.type === "user");
      let toSave = messages;
      if (userMsgs.length > 10) {
        const oldest = userMsgs[userMsgs.length - 10];
        const cutIdx = messages.indexOf(oldest);
        toSave = cutIdx > 0 ? messages.slice(cutIdx) : messages;
      }
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
  }, [messages, CHAT_STORAGE_KEY]);

  useEffect(() => {
    fetch("/api/perfis-vistos", { credentials: "include" }).then(r => r.json())
      .then(d => { if (d.vistos) setUrlsVistas(new Set(d.vistos)); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (hasStarted) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, hasStarted]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const runSearch = useCallback(async (filters: FilterTags | Record<string, unknown>, crits: Criterio[]) => {
    const searchMsgId = `search-${Date.now()}`;
    setIsSearching(true);
    setMessages(prev => [...prev, { id: searchMsgId, type: "ai-loading" }]);
    try {
      const res = await fetch("/api/linkedin-search", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...filters, vagaId: activeJob?.id, vaga_id: activeJob?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.upgrade_message || data?.error || "Erro na busca");

      const perfis: LinkedinProfile[] = (data.results || []).map((r: LinkedinProfile) => ({
        ...r, jaVisto: urlsVistas.has(r.linkedinUrl),
      }));
      perfis.sort((a, b) => {
        if (a.jaVisto && !b.jaVisto) return 1;
        if (!a.jaVisto && b.jaVisto) return -1;
        return (b.experiencia_anos || 0) - (a.experiencia_anos || 0);
      });
      setMessages(prev => prev.map(m =>
        m.id === searchMsgId ? { id: searchMsgId, type: "ai-results", results: perfis, source: data.source } : m
      ));
      setIsSearching(false);
      if (crits.length > 0) {
        setIsScoring(true);
        scoreCandidatesInBatches(perfis, crits).then(scored => {
          const sortedScored = [...scored].sort((a, b) => (b.score_final || 0) - (a.score_final || 0));
          setMessages(prev => prev.map(m => m.id === searchMsgId ? { ...m, results: sortedScored } : m));
        }).finally(() => setIsScoring(false));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro na busca";
      setMessages(prev => prev.map(m =>
        m.id === searchMsgId ? { id: searchMsgId, type: "ai-error", content: errorMessage } : m
      ));
      setIsSearching(false);
    }
  }, [activeJob?.id, urlsVistas]);

  async function handleSubmit() {
    if (!input.trim() || isAnalyzing) return;
    const userText = input.trim();
    setInput("");
    setHasStarted(true);
    const userMsgId = `user-${Date.now()}`;
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, type: "user", content: userText }, { id: loadingId, type: "ai-loading" }]);
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/nl-to-filters", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText, mode: "nl" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar");

      const novoCriterios: Criterio[] = (data.criterios || []).map((c: { nome: string; descricao: string; peso: number }, i: number) => ({
        id: `c${i}`, nome: c.nome, descricao: c.descricao, peso: c.peso,
      }));
      const novosFiltros: FilterTags = {
        job_titles: data.filtros_sugeridos?.job_titles || [],
        location: data.filtros_sugeridos?.localizacao || "",
        keywords: data.filtros_sugeridos?.keywords || [],
        booleanExpr: data.filtros_sugeridos?.boolean_expression || "",
        minYears: data.filtros_sugeridos?.experiencia_minima?.toString() || "",
        maxYears: data.filtros_sugeridos?.experiencia_maxima?.toString() || "",
        idiomas: data.filtros_sugeridos?.idiomas || [],
      };
      setCriterios(novoCriterios);
      setActiveFilters(novosFiltros as unknown as Record<string, unknown>);
      setMessages(prev => prev.map(m =>
        m.id === loadingId ? { id: loadingId, type: "ai-criterios", criterios: novoCriterios, filtros: novosFiltros } : m
      ));
      setIsAnalyzing(false);
      await runSearch(novosFiltros, novoCriterios);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao analisar";
      setMessages(prev => prev.map(m =>
        m.id === loadingId ? { id: loadingId, type: "ai-error", content: errorMessage } : m
      ));
      setIsAnalyzing(false);
    }
  }

  async function reRankResults(newCrits: Criterio[]) {
    const lastResults = messages.findLast(m => m.type === "ai-results");
    if (!lastResults?.results?.length) return;
    setIsScoring(true);
    setCriterios(newCrits);
    const scored = await scoreCandidatesInBatches(lastResults.results, newCrits);
    const sorted = [...scored].sort((a, b) => (b.score_final || 0) - (a.score_final || 0));
    setMessages(prev => prev.map(m => m.id === lastResults.id ? { ...m, results: sorted } : m));
    setIsScoring(false);
  }

  async function handleImport(r: LinkedinProfile) {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const candidateScore = r.score_final ? Math.round(r.score_final * 10) / 10 : 0;
    const candidateObj: Candidate = {
      id: `linkedin-${r.id}-${Date.now()}`,
      name: r.name, role: r.headline, company: r.company, city: r.location,
      score: candidateScore, avatarColor: color, initials: getInitials(r.name),
      confirmedTags: r.skills?.slice(0, 3) || [], partialTags: [], otherTags: [],
      shortlist: false, status: "triado", linkedinUrl: r.linkedinUrl,
    };
    try {
      const res = await fetch("/api/candidates", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: r.name, role: r.headline, company: r.company, city: r.location, linkedinUrl: r.linkedinUrl, score: candidateScore, status: "triado", vagaId: activeJob?.id }),
      });
      if (res.ok) { const data = await res.json(); if (data.candidate?.id) candidateObj.id = data.candidate.id; }
    } catch (e) { console.warn("[Importar] Erro:", e); }
    onImportCandidate(candidateObj);
    setImportedIds(prev => new Set(prev).add(r.id));
  }

  const notaColor = (n: number) => n >= 4 ? "text-emerald-600 bg-emerald-50" : n >= 3 ? "text-amber-600 bg-amber-50" : "text-red-500 bg-red-50";

  function SourceBadge({ source }: { source?: string }) {
    if (!source) return null;
    if (source === "cache" || source === "local_cache") return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
        <Database className="w-2.5 h-2.5" />Cache interno
      </span>
    );
    if (source === "smart_fallback") return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium border border-violet-200">
        <Zap className="w-2.5 h-2.5" />Perfis sugeridos por IA
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-200">
        <Sparkles className="w-2.5 h-2.5" />LinkedIn ao vivo
      </span>
    );
  }
  function renderMessage(msg: ChatMessage) {
    if (msg.type === "user") return (
      <div key={msg.id} className="flex justify-end mb-6">
        <div className="max-w-[70%] bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-sm">{msg.content}</div>
      </div>
    );
    if (msg.type === "ai-loading") return (
      <div key={msg.id} className="flex items-start gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
    if (msg.type === "ai-error") return (
      <div key={msg.id} className="flex items-start gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 text-red-700 text-[13px]">
          {msg.content || "Ocorreu um erro. Tente novamente."}
        </div>
      </div>
    );
    if (msg.type === "ai-criterios") return (
      <CriteriosInterativos key={msg.id} msg={msg} isSearching={isSearching}
        onRunSearch={(filtros, crits) => {
          setCriterios(crits);
          setActiveFilters(filtros as unknown as Record<string, unknown>);
          runSearch(filtros, crits);
        }} />
    );
    if (msg.type === "ai-results") {
      const results = msg.results || [];
      const visibleResults = ocultarVistos ? results.filter(r => !r.jaVisto) : results;
      const hiddenCount = results.filter(r => r.jaVisto).length;
      return (
        <div key={msg.id} className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 max-w-[92%]">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {results.length} candidatos encontrados
                    {isScoring && <span className="ml-2 text-[11px] text-indigo-500 font-normal"> Ranqueando com IA...</span>}
                  </p>
                  <SourceBadge source={msg.source} />
                </div>
                <div className="flex items-center gap-2">
                  {criterios.length > 0 && (
                    <button onClick={() => reRankResults(criterios)} disabled={isScoring}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50">
                      <RefreshCw className={`w-3 h-3 ${isScoring ? "animate-spin" : ""}`} />Re-rankear
                    </button>
                  )}
                  {hiddenCount > 0 && (
                    <button onClick={() => setOcultarVistos(!ocultarVistos)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${ocultarVistos ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {ocultarVistos ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {ocultarVistos ? "Mostrar todos" : `Ocultar vistos (${hiddenCount})`}
                    </button>
                  )}
                </div>
              </div>
              {criterios.length > 0 && (
                <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Ranqueando por:</span>
                  {criterios.slice(0, 4).map(c => (
                    <span key={c.id} className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] rounded-full font-medium">
                      P{c.peso} {c.nome.split(" ")[0]}
                    </span>
                  ))}
                </div>
              )}
              <div className="divide-y divide-gray-50">
                {visibleResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-[13px]">Nenhum candidato encontrado.</div>
                ) : visibleResults.map((r, idx) => {
                  const isImported = importedIds.has(r.id);
                  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <div key={r.id}
                      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group ${r.jaVisto ? "opacity-55" : ""}`}
                      onClick={() => setSelectedProfile(r)}>
                      {r.score_final ? <ScoreGauge score={r.score_final} /> : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: color + "20", color }}>
                          {getInitials(r.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</p>
                          {r.jaVisto && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full flex-shrink-0">Visto</span>}
                          {(r.experiencia_anos ?? 0) > 0 && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded-full flex-shrink-0">{r.experiencia_anos}a exp</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{r.headline}{r.company ? ` - ${r.company}` : ""}</p>
                        {r.criterios_avaliados ? (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {r.criterios_avaliados.slice(0, 3).map((c, i) => (
                              <span key={i} className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${notaColor(c.nota)}`}>{c.nome.split(" ")[0]}: {c.nota.toFixed(1)}</span>
                            ))}
                          </div>
                        ) : r.skills?.length ? (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {r.skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500 font-medium">{s}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <a href={r.linkedinUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={e => { e.stopPropagation(); handleImport(r); }} disabled={isImported}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${isImported ? "bg-emerald-50 text-emerald-600" : "border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600"}`}>
                          <Plus className="w-3 h-3" />{isImported ? "Importado" : "Importar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {criterios.length > 0 && (
              <div className="mt-3 flex items-center gap-2 pl-1">
                <button onClick={() => setIsFiltersOpen(true)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-xl px-3 py-1.5 bg-white transition-all">
                  <SlidersHorizontal className="w-3.5 h-3.5" />Ajustar filtros
                </button>
                <span className="text-[11px] text-gray-300">-</span>
                <button onClick={() => runSearch(activeFilters as FilterTags, criterios)} disabled={isSearching}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-xl px-3 py-1.5 bg-white transition-all disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />Nova busca
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  }
  if (!hasStarted) return (
    <div className="relative flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-14 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="absolute right-12 top-24 h-48 w-48 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <div className="mb-6 flex items-center gap-3 text-[12px] flex-wrap justify-center">
        {[
          { n: "1", label: "Descreva o perfil", active: true },
          { n: "2", label: "Edite criterios e filtros", active: false },
          { n: "3", label: "Busca + Ranking IA", active: false },
        ].map((step, i) => (
          <React.Fragment key={step.n}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${step.active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-400 border-gray-200"}`}>
              <span className="font-bold text-[11px]">{step.n}</span>
              <span className="font-medium">{step.label}</span>
            </div>
            {i < 2 && <span className="text-gray-300">-&gt;</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-3.5 py-1.5 text-[12px] font-medium text-indigo-700 shadow-sm backdrop-blur">
        <Sparkles className="w-3.5 h-3.5" />Busca com IA em linguagem natural
      </div>
      <h1 className="mb-3 max-w-2xl text-center text-[30px] font-semibold tracking-tight text-gray-900 sm:text-[34px]">
        Quem voce esta buscando hoje?
      </h1>
      <p className="mb-8 max-w-lg text-center text-[14px] leading-6 text-gray-500">
        Descreva o perfil ideal em linguagem natural. A IA gera os criterios, voce edita, e a busca roda com Cache-First no banco interno.
      </p>

      <div className="w-full max-w-[760px] overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
        <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Ex: Designer de Email com Figma e CRM, ingles fluente, passagem por agencias..."
          rows={3} className="w-full resize-none bg-transparent px-6 pt-5 pb-3 text-[15px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400" />
        <div className="flex items-center justify-between border-t border-gray-100/80 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 px-4 py-3">
          <button onClick={() => setIsFiltersOpen(true)}
            className={`flex items-center gap-2 border rounded-xl font-medium transition-all text-[12px] px-3 py-2 ${hasActiveFilters(activeFilters) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />Filtros avancados
          </button>
          <button onClick={handleSubmit} disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm transition-colors hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200">
            <ArrowUp className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex max-w-[760px] flex-wrap justify-center gap-2">
        {SUGESTOES.map((s, i) => (
          <button key={i} onClick={() => setInput(s)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12px] text-gray-600 shadow-sm transition-all hover:-translate-y-[1px] hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md">
            {s}
          </button>
        ))}
      </div>

      <AdvancedFiltersDrawer isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}
        onSearch={f => { setAdvancedFilters(f); setIsFiltersOpen(false); }} />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] relative">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-4 pt-6 pb-4">
          {messages.map(renderMessage)}
          {isScoring && (
            <div className="flex items-center gap-2 text-[12px] text-indigo-600 mb-4 pl-11">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />Avaliando candidatos com IA...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Refine a busca ou descreva outro perfil..."
              rows={1} disabled={isAnalyzing || isSearching}
              className="w-full px-4 pt-3 pb-2 text-[14px] text-gray-900 resize-none outline-none placeholder:text-gray-400 bg-transparent leading-relaxed disabled:opacity-50" />
            <div className="flex items-center justify-between px-3 pb-2.5 border-t border-gray-100 pt-2">
              <button onClick={() => setIsFiltersOpen(true)}
                className={`flex items-center gap-2 border rounded-xl font-medium transition-all text-[11px] px-2.5 py-1.5 ${hasActiveFilters(activeFilters) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"}`}>
                <SlidersHorizontal className="w-3 h-3" />Filtros avancados
                {hasActiveFilters(activeFilters) && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">v</span>
                )}
              </button>
              <button onClick={handleSubmit} disabled={!input.trim() || isAnalyzing || isSearching}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                {isAnalyzing || isSearching
                  ? <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  : <ArrowUp className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-300 mt-2">A IA pode cometer erros - verifique informacoes importantes.</p>
        </div>
      </div>

      <AdvancedFiltersDrawer isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}
        onSearch={f => { setAdvancedFilters(f); setIsFiltersOpen(false); runSearch(f as unknown as Record<string, unknown>, criterios); }} />
      <LinkedinPreviewDrawer profile={selectedProfile}
        onClose={() => {
          if (selectedProfile) {
            setUrlsVistas(prev => new Set(prev).add(selectedProfile.linkedinUrl));
            setMessages(prev => prev.map(m =>
              m.type === "ai-results"
                ? { ...m, results: m.results?.map(r => r.linkedinUrl === selectedProfile.linkedinUrl ? { ...r, jaVisto: true } : r) }
                : m
            ));
          }
          setSelectedProfile(null);
        }}
        onShortlist={p => { handleImport(p); setSelectedProfile(null); }}
        onAddPipeline={p => { handleImport(p); setSelectedProfile(null); }}
        onHide={p => {
          setMessages(prev => prev.map(m =>
            m.type === "ai-results"
              ? { ...m, results: m.results?.map(r => r.id === p.id ? { ...r, jaVisto: true } : r) }
              : m
          ));
        }}
      />
    </div>
  );
}
