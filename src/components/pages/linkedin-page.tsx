"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Candidate, Job } from "@/lib/types";
import { AVATAR_COLORS } from "@/lib/mock-data";
import {
  Search, SlidersHorizontal, Sparkles, ExternalLink, Plus, 
  AlertCircle, X, Check, ChevronDown, ChevronUp, Copy,
  ArrowUp, PlayCircle, Eye, EyeOff, LayoutGrid, List, FileText,
  ChevronLeft, ChevronRight, Lock, RotateCcw, Share2, UploadCloud,
  Mail, Phone, CircleDollarSign, Calendar, Building2, MapPin,
  ThumbsUp, ThumbsDown, Database, Zap, Sparkle, Link as LinkIcon
} from "lucide-react";

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
  countries?: string;
  workOption?: { hybrid?: boolean; remote?: boolean; onsite?: boolean };
  currentJobTitles?: string;
  pastJobTitles?: string;
  seniority?: { junior?: boolean; pleno?: boolean; senior?: boolean; lead?: boolean };
  currentCompany?: string;
  pastCompany?: string;
  excludeCompany?: string;
  industries?: string;
  revenue?: string;
  fundingRound?: { seed?: boolean; seriesA?: boolean; seriesB?: boolean; ipo?: boolean };
  requiredKeywords?: string;
  optionalKeywords?: string;
  excludeKeywords?: string;
  timeInRole?: string;
  companyGrowth?: string;
  likelyToSwitch?: string;
  contactInfo?: string;
}

export interface LinkedinProfile {
  id: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  linkedinUrl: string;
  avatarUrl: string | null;
  score_final?: number;
  criterios_avaliados?: Array<{
    nome: string;
    nota: number;
    peso: number;
    justificativa: string;
  }>;
  resumo?: string;
  experiencia_anos?: number;
  skills?: string[];
  experiencias?: Array<{
    cargo: string;
    empresa: string;
    inicio: string;
    fim: string | null;
  }>;
  formacao?: string;
  idiomas?: string[];
  sobre?: string;
  jaVisto?: boolean;
}

// Initial mock candidates to populate UI beautifully as in the screenshots
const INITIAL_MOCK_PROFILES: LinkedinProfile[] = [
  {
    id: "william-da-silva",
    name: "William da Silva",
    headline: "Desenvolvedor Web - Site MDM",
    company: "MDM Mecanica Diesel",
    location: "Parana, Parana, Brazil",
    linkedinUrl: "https://linkedin.com/in/william-da-silva",
    avatarUrl: null,
    score_final: 4.8,
    experiencia_anos: 14,
    skills: ["Photoshop", "React", "Figma", "HTML/CSS"],
    experiencias: [
      {
        cargo: "Desenvolvedor Web - Site MDM",
        empresa: "MDM Mecanica Diesel",
        inicio: "Nov 2023",
        fim: "Present"
      },
      {
        cargo: "Desenvolvedor Web",
        empresa: "Coach Botão",
        inicio: "Sep 2023",
        fim: "Nov 2023"
      },
      {
        cargo: "Designer",
        empresa: "Individual",
        inicio: "Jul 2010",
        fim: "Sep 2023"
      }
    ],
    formacao: "Ciência da Computação - UFPR",
    idiomas: ["Português (Nativo)", "Inglês (Avançado)"],
    sobre: "Profissional experiente atuando na intersecção entre design visual e engenharia de software frontend.",
    criterios_avaliados: [
      { nome: "Photoshop", nota: 5.0, peso: 5, justificativa: "O candidato lista habilidades com Photoshop" },
      { nome: "Security", nota: 1.0, peso: 4, justificativa: "Nenhum histórico de emprego indica passagem por empresa de segurança privada." }
    ]
  },
  {
    id: "gustavo-berti",
    name: "Gustavo Berti",
    headline: "Designer Gráfico",
    company: "Cropfield OO Brasil",
    location: "Parana, Brazil",
    linkedinUrl: "https://linkedin.com/in/gustavo-berti",
    avatarUrl: null,
    score_final: 4.2,
    experiencia_anos: 8,
    skills: ["Figma", "Photoshop", "Illustrator"],
    experiencias: [
      {
        cargo: "Designer Gráfico",
        empresa: "Cropfield OO Brasil",
        inicio: "Mar 2021",
        fim: "Present"
      }
    ],
    formacao: "Design de Produto - UTFPR",
    idiomas: ["Português (Nativo)"],
    criterios_avaliados: [
      { nome: "Photoshop", nota: 5.0, peso: 5, justificativa: "Forte portfólio e domínio demonstrado de ferramentas Adobe." }
    ]
  },
  {
    id: "ketlin-amaral",
    name: "Ketlin Amaral",
    headline: "Freelance Graphic Designer",
    company: "Autônoma",
    location: "Curitiba, Parana, Brazil",
    linkedinUrl: "https://linkedin.com/in/ketlin-amaral",
    avatarUrl: null,
    score_final: 3.5,
    experiencia_anos: 5,
    skills: ["Photoshop", "Branding", "Social Media"],
    experiencias: [
      {
        cargo: "Freelance Graphic Designer",
        empresa: "Autônoma",
        inicio: "Jan 2022",
        fim: "Present"
      }
    ],
    formacao: "Publicidade - PUCPR",
    idiomas: ["Português (Nativo)", "Inglês (Intermediário)"],
    criterios_avaliados: [
      { nome: "Photoshop", nota: 4.5, peso: 5, justificativa: "Experiência sólida na criação de peças publicitárias usando Photoshop." }
    ]
  }
];

export default function LinkedinPage({ activeJob, onImportCandidate }: LinkedinPageProps) {
  // Page search query state
  const [queryText, setQueryText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "insights">("results");
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  
  // Modals state
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEditQueryOpen, setIsEditQueryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [generatingShare, setGeneratingShare] = useState(false);

  // Search Results
  const [profiles, setProfiles] = useState<LinkedinProfile[]>(INITIAL_MOCK_PROFILES);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  // Criteria mock data
  const [criteria, setCriteria] = useState<Criterio[]>([
    { id: "c1", nome: "The candidate has hands-on project experience with Photoshop.", descricao: "Experiência prática com Photoshop.", peso: 5 },
    { id: "c2", nome: "The candidate has worked at a private security company.", descricao: "Passagem anterior por empresas de segurança privada.", peso: 4 }
  ]);
  
  // Filters state (from Image 3)
  const [filters, setFilters] = useState<FilterTags>({
    minYears: "5",
    maxYears: "",
    location: "Parana",
    countries: "Brasil",
    workOption: { hybrid: true, remote: true, onsite: false },
    currentJobTitles: "Designer",
    pastJobTitles: "",
    seniority: { junior: false, pleno: true, senior: true, lead: false },
    currentCompany: "",
    pastCompany: "",
    excludeCompany: "",
    industries: "Tecnologia, Design",
    revenue: "any",
    fundingRound: { seed: false, seriesA: false, seriesB: false, ipo: false },
    requiredKeywords: "Photoshop",
    optionalKeywords: "Illustrator, Figma",
    excludeKeywords: "",
    timeInRole: "any",
    companyGrowth: "any",
    likelyToSwitch: "any",
    contactInfo: "any",
  });
  
  // Active Filter Categories
  const [activeFilterCategory, setActiveFilterCategory] = useState("Geral");
  const [hideInactiveFilters, setHideInactiveFilters] = useState(false);

  // Paywall reveal state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());

  // Copy share link feedback
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (isShareOpen && !shareLink) {
      (async () => {
        setGeneratingShare(true);
        try {
          const res = await fetch("/api/search/public", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vagaId: activeJob?.id || "550e8400-e29b-41d4-a716-446655440000",
              criterios: criteria,
              candidates: profiles,
            }),
          });
          const data = await res.json();
          if (res.ok && data.shareLink) {
            setShareLink(data.shareLink);
          } else {
            setShareLink(`http://localhost:3000/search/public/sh_mock_${activeJob?.id || "id"}`);
          }
        } catch {
          setShareLink(`http://localhost:3000/search/public/sh_mock_${activeJob?.id || "id"}`);
        } finally {
          setGeneratingShare(false);
        }
      })();
    }
  }, [isShareOpen, activeJob?.id, profiles, criteria, shareLink]);

  // Sidebar expanded / collapsed link
  const selectedProfile = selectedProfileIndex !== null ? profiles[selectedProfileIndex] : null;

  // Handler for candidate select
  const handleSelectProfile = (index: number) => {
    setSelectedProfileIndex(index);
  };

  // Navigations in Drawer
  const handlePrevProfile = () => {
    if (selectedProfileIndex !== null && selectedProfileIndex > 0) {
      setSelectedProfileIndex(selectedProfileIndex - 1);
    }
  };

  const handleNextProfile = () => {
    if (selectedProfileIndex !== null && selectedProfileIndex < profiles.length - 1) {
      setSelectedProfileIndex(selectedProfileIndex + 1);
    }
  };

  const handleRowCheckbox = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllRows = () => {
    if (selectedRowIds.size === profiles.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(profiles.map(p => p.id)));
    }
  };

  const handleRevealContact = (id: string, type: "email" | "phone") => {
    if (isSubscribed) {
      setRevealedContacts(prev => new Set(prev).add(`${id}-${type}`));
    } else {
      setIsPaywallOpen(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink || `https://rankhire.br/search/public/sh_9a2f1b80d7`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Run new search
  const handleRunSearch = async () => {
    setIsSearching(true);
    setIsEditQueryOpen(false);
    try {
      const res = await fetch("/api/linkedin-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: filters.currentJobTitles || queryText,
          location: filters.location,
          minYears: filters.minYears,
          maxYears: filters.maxYears,
          keywords: filters.requiredKeywords ? filters.requiredKeywords.split(",").map(k => k.trim()) : [],
          vagaId: activeJob?.id || "550e8400-e29b-41d4-a716-446655440000",
          criterios: criteria,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.resultados || data.candidatos || [];
        if (results.length > 0) {
          setProfiles(results);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar candidatos reais:", err);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  // Criteria update handler
  const handleUpdateCriteria = () => {
    setIsCriteriaOpen(false);
    setIsScoring(true);
    setTimeout(() => {
      setIsScoring(false);
    }, 1000);
  };

  // Shortlist action
  const handleShortlist = (p: LinkedinProfile) => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const score = p.score_final ? Math.round(p.score_final * 10) / 10 : 0;
    const candidateObj: Candidate = {
      id: `linkedin-${p.id}-${Date.now()}`,
      name: p.name,
      role: p.headline,
      company: p.company,
      city: p.location,
      score: score,
      avatarColor: color,
      initials: p.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase(),
      confirmedTags: p.skills?.slice(0, 3) || [],
      partialTags: [],
      otherTags: [],
      shortlist: true,
      status: "triado",
      linkedinUrl: p.linkedinUrl,
    };
    onImportCandidate(candidateObj);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFCFF] overflow-hidden relative">
      
      {/* ── Topbar (Fidelidade Visual do Topo) ── */}
      <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
          <span>{activeJob?.company || "Empresa"}</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span>Buscas</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-800 font-semibold truncate max-w-[240px]">
            {activeJob?.title || "Nova Busca"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs shadow-sm transition-all"
          >
            <Share2 size={13} className="text-slate-500" />
            <span>Compartilhar</span>
          </button>
          <button 
            onClick={() => {
              setHasSearched(false);
              setQueryText("");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus size={13} />
            <span>Nova busca</span>
          </button>
        </div>
      </div>

      {/* ── Outer Layout (Split-Screen Container) ── */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* ── Left Panel: Main Workspace Content ── */}
        <div className={`transition-all duration-300 flex flex-col h-full overflow-hidden ${selectedProfile ? 'w-[45%]' : 'w-full'}`}>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* ── Search Bar Area (Se contrai para o topo) ── */}
            <div className="w-full flex flex-col gap-4">
              {!hasSearched ? (
                // Estado Inicial (Vazio e Expansivo)
                <div className="max-w-[760px] mx-auto w-full py-16 flex flex-col items-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-3.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Busca Inteligente com IA
                  </div>
                  <h1 className="mb-2 text-center text-[28px] font-bold text-slate-900 tracking-tight">
                    Quem você está buscando hoje?
                  </h1>
                  <p className="mb-8 text-center text-sm text-slate-500 max-w-md">
                    Descreva o perfil ideal em linguagem natural. A IA define os critérios e filtros automaticamente.
                  </p>
                  
                  <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-1">
                    <textarea 
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Ex: Designer gráfico no Paraná com 5 anos de experiência e Photoshop..."
                      rows={3}
                      className="w-full resize-none bg-transparent px-5 py-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl">
                      <button 
                        onClick={() => setIsFiltersOpen(true)}
                        className="flex items-center gap-2 border border-slate-200 bg-white rounded-xl font-semibold text-[11px] px-3 py-2 text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        Filtros avançados
                      </button>
                      <button 
                        onClick={handleRunSearch}
                        disabled={!queryText.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] hover:opacity-95 shadow text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSearching ? <RotateCcw size={16} className="animate-spin" /> : <ArrowUp size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Estado de Resultado (Barra comprimida em formato pílula no topo)
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center gap-2 w-full">
                    {/* Search Pill Input Bar */}
                    <div 
                      onClick={() => setIsEditQueryOpen(true)}
                      className="flex-1 bg-white border border-slate-200 rounded-full h-11 px-4 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Circle logo badge */}
                        <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0">
                          <Sparkle size={12} className="text-white fill-white" />
                        </div>
                        <span className="text-[13px] text-slate-800 font-medium truncate">
                          {queryText}
                        </span>
                      </div>
                      <Search size={14} className="text-slate-400 flex-shrink-0" />
                    </div>

                    {/* Filtros & Critérios Quick Buttons */}
                  <button 
                    onClick={() => setIsFiltersOpen(true)}
                    className="flex items-center gap-1.5 h-11 px-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <SlidersHorizontal size={13} className="text-slate-500" />
                    <span className="text-[12px] font-semibold text-slate-700">Filtros</span>
                    {Object.values(filters).filter(v => v && v !== "any" && (typeof v !== "object" || Object.values(v).some(Boolean))).length > 0 && (
                      <span className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {Object.values(filters).filter(v => v && v !== "any" && (typeof v !== "object" || Object.values(v as Record<string,unknown>).some(Boolean))).length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsCriteriaOpen(true)}
                    className="flex items-center gap-1.5 h-11 px-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Sparkles size={13} className="text-slate-500" />
                    <span className="text-[12px] font-semibold text-slate-700">Critérios</span>
                    {criteria.length > 0 && (
                      <span className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{criteria.length}</span>
                    )}
                  </button>
                </div>

                {/* Suggestion Expansion Chips */}
                {profiles.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-medium"><Sparkles size={11} /> Expandir pool:</span>
                    {filters.excludeCompany && (
                      <button 
                        onClick={() => setFilters(prev => ({ ...prev, excludeCompany: "" }))}
                        className="px-2.5 py-1 bg-white border border-[#7C3AED]/20 text-[#7C3AED] rounded-full font-semibold hover:bg-purple-50 transition-colors"
                      >
                        Remover filtro: empresa excluída
                      </button>
                    )}
                    {filters.requiredKeywords && (
                      <button 
                        onClick={() => setFilters(prev => ({ ...prev, requiredKeywords: "" }))}
                        className="px-2.5 py-1 bg-white border border-[#7C3AED]/20 text-[#7C3AED] rounded-full font-semibold hover:bg-purple-50 transition-colors"
                      >
                        Remover filtro: {filters.requiredKeywords.split(",")[0].trim()}
                      </button>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>

            {/* ── Main Workspace Body (Fidelidade do Painel) ── */}
            {hasSearched && (
              <div className="flex flex-col flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Result Tabs Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                  <button 
                    onClick={() => setActiveTab("results")}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "results" 
                        ? "border-[#7C3AED] text-[#7C3AED]" 
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Resultados
                  </button>
                  <button 
                    onClick={() => setActiveTab("insights")}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                      activeTab === "insights" 
                        ? "border-[#7C3AED] text-[#7C3AED]" 
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Análises
                  </button>
                </div>

                {/* Toolbar */}
                <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedRowIds.size === profiles.length} 
                      onChange={handleSelectAllRows}
                      className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                    />
                    <div className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                      <span>Matches ({profiles.length})</span>
                      <ChevronDown size={14} />
                    </div>
                    
                    {/* View Switcher Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1 rounded-md transition-all ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        title="List View"
                      >
                        <List size={13} />
                      </button>
                      <button 
                        onClick={() => setViewMode("table")}
                        className={`p-1 rounded-md transition-all ${viewMode === "table" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        title="Table View"
                      >
                        <LayoutGrid size={13} />
                      </button>
                    </div>

                    <button className="flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                      <FileText size={12} />
                      <span>Revisar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Search size={13} className="hover:text-slate-600 cursor-pointer" />
                    <span className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-0.5 cursor-pointer hover:text-slate-600">
                      <LayoutGrid size={13} />
                      <ChevronDown size={10} />
                    </div>
                  </div>
                </div>

                {/* Candidates List/Table Representation */}
                <div className="flex-1 overflow-y-auto">
                  {viewMode === "table" ? (
                    // Tabela Compacta (Image 1)
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 select-none">
                          <th className="pl-4 pr-2 py-2.5 w-8"></th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Nome</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Perfis</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Cargo</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Empresa</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Status</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px]">Match</th>
                          <th className="px-3 py-2.5 font-medium uppercase tracking-wider text-[10px] text-right pr-6">Critério</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profiles.map((p, idx) => {
                          const isSelected = selectedProfileIndex === idx;
                          return (
                            <tr 
                              key={p.id}
                              onClick={() => handleSelectProfile(idx)}
                              className={`group cursor-pointer hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                            >
                              <td className="pl-4 pr-2 py-3" onClick={e => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedRowIds.has(p.id)}
                                  onChange={() => handleRowCheckbox(p.id)}
                                  className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{p.name}</td>
                              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5">
                                  <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                    <span className="text-[10px] text-blue-700 font-extrabold font-serif">in</span>
                                  </a>
                                  <span className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold">X</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-slate-600 truncate max-w-[160px]" title={p.headline}>{p.headline}</td>
                              <td className="px-3 py-3 text-slate-600 truncate max-w-[160px]" title={p.company}>
                                <span className="flex items-center gap-1">
                                  <Building2 size={11} className="text-slate-400" />
                                  {p.company}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleShortlist(p)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-[10px] text-slate-600 font-semibold"
                                >
                                  <span className="w-2.5 h-2.5 rounded bg-purple-500 block"></span>
                                  <span>Selecionar</span>
                                </button>
                              </td>
                              <td className="px-3 py-3 font-bold text-slate-700">57%</td>
                              <td className="px-3 py-3 text-right pr-6" onClick={e => e.stopPropagation()}>
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm hover:scale-105 transition-transform" title="Photoshop atendido">
                                  <ThumbsUp size={11} className="fill-emerald-600" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    // Visão de Lista Detalhada (Image 5 Style)
                    <div className="divide-y divide-slate-100 flex flex-col">
                      {profiles.map((p, idx) => {
                        const isSelected = selectedProfileIndex === idx;
                        const isImported = selectedRowIds.has(p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectProfile(idx)}
                            className={`p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex flex-col gap-3 group relative ${isSelected ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-sm font-bold">
                                  {p.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                                    <div className="flex items-center gap-1">
                                      <span className="w-4 h-4 rounded bg-blue-50 text-blue-700 text-[8px] font-extrabold flex items-center justify-center font-serif">in</span>
                                      <span className="w-4 h-4 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center">X</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">{p.location}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleShortlist(p)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all ${
                                    isImported 
                                      ? "bg-purple-50 text-[#7C3AED] border-[#7C3AED]/20" 
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>Selecionar</span>
                                </button>
                              </div>
                            </div>

                            {/* Job Timeline (Image 5 style) */}
                            <div className="pl-12 flex flex-col gap-1.5 text-xs text-slate-600">
                              {p.experiencias?.map((exp, eIdx) => (
                                <div key={eIdx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 flex-shrink-0"></span>
                                  <span>
                                    <strong>{exp.cargo}</strong> na <span className="text-slate-950 font-medium">{exp.empresa}</span>
                                    <span className="text-slate-400 ml-1.5 font-normal">({exp.inicio} - {exp.fim || "Atual"})</span>
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Semantic Tags (Image 5 style) */}
                            <div className="pl-12 flex flex-wrap gap-2 mt-1">
                              {p.criterios_avaliados?.map((ev, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                    ev.nota >= 4 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {ev.nota >= 4 ? <ThumbsUp size={11} className="fill-emerald-700 text-emerald-700" /> : <ThumbsDown size={11} className="fill-rose-700 text-rose-700" />}
                                  <span>{ev.nome}: {ev.justificativa}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Upgrade Limits Banner (Fidelidade Visual Base) ── */}
                <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-center flex-shrink-0">
                  <div className="max-w-md w-full bg-slate-50/50 border border-slate-200/60 rounded-xl px-5 py-3 flex items-center justify-between gap-6 shadow-sm">
                    <div className="flex-1 flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 mb-1">
                        3 buscas gratuitas restantes
                      </span>
                      {/* Custom progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#7C3AED] h-full rounded-full" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPaywallOpen(true)}
                      className="bg-[#7C3AED] text-white hover:opacity-95 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Fazer Upgrade</span>
                      <ArrowUp size={12} className="rotate-45" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Split-Screen Candidate Detail Drawer ── */}
        <div className={`transition-all duration-300 h-full overflow-hidden flex ${selectedProfile ? 'w-[55%] border-l border-slate-200 bg-white' : 'w-0'}`}>
          {selectedProfile && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              
              {/* Drawer Top Navigation & Actions Header */}
              <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                  <button 
                    onClick={handlePrevProfile}
                    disabled={selectedProfileIndex === 0}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-400 px-1 border-x border-slate-100 select-none">
                    {(selectedProfileIndex || 0) + 1} / {profiles.length}
                  </span>
                  <button 
                    onClick={handleNextProfile}
                    disabled={selectedProfileIndex === profiles.length - 1}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShortlist(selectedProfile)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all shadow-sm"
                  >
                    <span className="w-2 h-2 rounded bg-purple-500 block"></span>
                    <span>Selecionar</span>
                  </button>
                  <button 
                    onClick={() => handleRevealContact(selectedProfile.id, "email")}
                    className="bg-[#7C3AED] hover:opacity-95 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow"
                  >
                    Entrar em Contato
                  </button>
                  <button 
                    onClick={() => setSelectedProfileIndex(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Candidate Info Header */}
              <div className="p-6 border-b border-slate-200 flex items-start gap-4 flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {selectedProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-black text-slate-900 truncate leading-snug">{selectedProfile.name}</h2>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a href={selectedProfile.linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold flex items-center justify-center font-serif border border-blue-100">in</span>
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {selectedProfile.location}
                  </p>

                  <div className="flex items-center gap-4 mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Atual</span>
                      <span className="text-xs text-slate-800 font-semibold truncate max-w-[150px]">{selectedProfile.headline}</span>
                    </div>
                    <div className="w-px h-5 bg-slate-200" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Anterior</span>
                      <span className="text-xs text-slate-800 font-semibold truncate max-w-[150px]">Designer at Individual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal Tabs */}
              <div className="flex px-6 border-b border-slate-200 bg-slate-50/30 flex-shrink-0">
                {["Visão Geral", "Experiência", "Formação", "Competências", "Mais"].map((t) => (
                  <button
                    key={t}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-[#7C3AED] border-b-2 border-transparent hover:border-[#7C3AED] transition-colors focus:outline-none"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Drawer Content Body (Vertical scrolling) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Contact and Metadata Reveal section */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Detalhes de Contato</span>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email detail */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Mail size={12} /> E-mail</span>
                      {revealedContacts.has(`${selectedProfile.id}-email`) ? (
                        <span className="text-xs text-slate-900 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg select-all">
                          william.silva@gmail.com
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleRevealContact(selectedProfile.id, "email")}
                          className="bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-[#7C3AED]/20 transition-all"
                        >
                          <span>Revelar e-mail</span>
                          <Lock size={11} />
                        </button>
                      )}
                    </div>
                    {/* Phone detail */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Phone size={12} /> Telefone</span>
                      {revealedContacts.has(`${selectedProfile.id}-phone`) ? (
                        <span className="text-xs text-slate-900 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg select-all">
                          +55 (41) 99888-7766
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleRevealContact(selectedProfile.id, "phone")}
                          className="bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-[#7C3AED]/20 transition-all"
                        >
                          <span>Revelar número</span>
                          <Lock size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumo timeline de experiencia (18 anos, 6 anos permanencia media) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumo de Experiência</span>
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      18 anos de experiência total · 6 anos permanência média
                    </span>
                  </div>
                  
                  <div className="relative pl-4 border-l-2 border-slate-150 space-y-4">
                    {selectedProfile.experiencias?.map((exp, expIdx) => (
                      <div key={expIdx} className="relative">
                        {/* Custom dot icon */}
                        <div className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-[#7C3AED] border-2 border-white ring-2 ring-purple-100"></div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-900 leading-snug">{exp.cargo}</span>
                           <span className="text-xs text-slate-600 font-medium">{exp.empresa}</span>
                           <span className="text-[10.5px] text-slate-400 mt-0.5 font-normal">{exp.inicio} - {exp.fim || "Atual"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competências Section */}
                {selectedProfile.skills && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Competências ({selectedProfile.skills.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.skills.map((sk) => (
                        <span key={sk} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-semibold">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── MODALS (Replicando Layouts da Referência) ── */}

      {/* 1. CRITERIA MODAL */}
      {isCriteriaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-900 text-base">Critérios de Avaliação</h3>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline font-semibold">
                  <Sparkles size={12} />
                  <span>Usar Predefinição</span>
                </button>
                <button className="flex items-center gap-1 text-xs text-[#7C3AED] hover:underline font-semibold">
                  <Plus size={12} />
                  <span>Salvar Predefinição</span>
                </button>
                <button onClick={() => setIsCriteriaOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Mais Importante</span>
              
              <div className="space-y-2">
                {criteria.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group">
                    <div className="flex flex-col gap-0.5 text-slate-300 group-hover:text-slate-400 cursor-grab select-none">
                      <span className="w-3.5 h-0.5 bg-current rounded-full"></span>
                      <span className="w-3.5 h-0.5 bg-current rounded-full"></span>
                      <span className="w-3.5 h-0.5 bg-current rounded-full"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                    <p className="flex-1 text-xs text-slate-800 font-semibold leading-relaxed">
                      {c.nome}
                    </p>
                    <button 
                      onClick={() => setCriteria(prev => prev.filter(cr => cr.id !== c.id))}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block pt-2">Menos Importante</span>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button 
                onClick={() => setCriteria(prev => [...prev, { id: `c${Date.now()}`, nome: "Novo critério de avaliação", descricao: "", peso: 3 }])}
                className="text-xs text-slate-600 hover:text-slate-800 font-bold border border-slate-200 bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                + Adicionar Critério
              </button>
              <button 
                onClick={handleUpdateCriteria}
                className="bg-[#7C3AED] hover:opacity-95 text-white font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center gap-1"
              >
                <span>Atualizar</span>
                <ArrowUp size={12} className="rotate-45" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILTERS MODAL — Profissional */}
      {isFiltersOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[900px] border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '88vh' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="font-semibold text-slate-900 text-lg">Filtros Avançados de Sourcing</h3>
              <div className="flex items-center gap-3">
                {profiles.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                    {profiles.length} {profiles.length === 1 ? "resultado" : "resultados"}
                  </span>
                )}
                <button onClick={() => setIsFiltersOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">&times;</button>
              </div>
            </div>

            {/* Body — Split em duas colunas */}
            <div className="flex flex-1 overflow-hidden">
              {/* Coluna Esquerda — Categorias */}
              <div className="w-64 border-r border-slate-100 p-4 space-y-1 bg-slate-50/50 text-sm font-medium text-slate-600 flex-shrink-0 overflow-y-auto">
                {[
                  { key: "experiencia", label: "Experiência & Senioridade" },
                  { key: "localizacao", label: "Localização & Trabalho Remoto" },
                  { key: "competencias", label: "Competências & Tech Stack" },
                  { key: "empresas", label: "Empresas" },
                  { key: "setor", label: "Setor de Atuação" },
                  { key: "metricas", label: "Métricas & Financiamento" },
                  { key: "sinais", label: "Sinais de Mercado" },
                ].map(({ key, label }) => {
                  const isActive = activeFilterCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveFilterCategory(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive 
                          ? "bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20" 
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Coluna Direita — Campos do filtro selecionado */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">

                {/* ── Experiência & Senioridade ── */}
                {activeFilterCategory === "experiencia" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Tempo de Experiência (Anos)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-medium">Mínimo</span>
                          <input
                            type="number"
                            value={filters.minYears || ""}
                            onChange={e => setFilters(prev => ({ ...prev, minYears: e.target.value }))}
                            placeholder="Ex: 3"
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-medium">Máximo</span>
                          <input
                            type="number"
                            value={filters.maxYears || ""}
                            onChange={e => setFilters(prev => ({ ...prev, maxYears: e.target.value }))}
                            placeholder="Ex: 15"
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Nível de Senioridade</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["Júnior", "Pleno", "Sênior", "Especialista", "Liderança", "Direção"] as const).map(nivel => (
                          <label key={nivel} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-[#7C3AED]/30 transition-colors">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                              checked={!!(filters.seniority as Record<string, boolean | undefined>)?.[nivel.toLowerCase()]}
                              onChange={e => setFilters(prev => ({ ...prev, seniority: { ...(prev.seniority || {}), [nivel.toLowerCase()]: e.target.checked } }))}
                            />
                            {nivel}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Dados de Contato Obrigatórios</label>
                      <select
                        value={filters.contactInfo || "any"}
                        onChange={e => setFilters(prev => ({ ...prev, contactInfo: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer w-56"
                      >
                        <option value="any">Qualquer contato</option>
                        <option value="email">Requer e-mail verificado</option>
                        <option value="phone">Requer telefone verificado</option>
                        <option value="both">Requer e-mail e telefone</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── Localização & Trabalho Remoto ── */}
                {activeFilterCategory === "localizacao" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Localização</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-medium">Cidade / Estado</span>
                          <input
                            type="text"
                            value={filters.location || ""}
                            onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Ex: Curitiba, Paraná"
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500 font-medium">País</span>
                          <input
                            type="text"
                            value={filters.countries || ""}
                            onChange={e => setFilters(prev => ({ ...prev, countries: e.target.value }))}
                            placeholder="Ex: Brasil"
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Modelo de Trabalho</label>
                      <div className="space-y-2">
                        {[{ key: "remote", label: "Apenas Remoto" }, { key: "hybrid", label: "Híbrido" }, { key: "onsite", label: "Presencial" }].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-[#7C3AED]/30 transition-colors">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                              checked={!!(filters.workOption as Record<string, boolean | undefined>)?.[key]}
                              onChange={e => setFilters(prev => ({ ...prev, workOption: { ...(prev.workOption || {}), [key]: e.target.checked } }))}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Competências & Tech Stack ── */}
                {activeFilterCategory === "competencias" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Competências obrigatórias (AND)</label>
                      <p className="text-xs text-slate-400">Candidate deve ter TODAS essas habilidades</p>
                      <input
                        type="text"
                        value={filters.requiredKeywords || ""}
                        onChange={e => setFilters(prev => ({ ...prev, requiredKeywords: e.target.value }))}
                        placeholder="Ex: React, TypeScript, Node.js"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Competências desejáveis (OR)</label>
                      <p className="text-xs text-slate-400">Candidate deve ter pelo menos uma dessas</p>
                      <input
                        type="text"
                        value={filters.optionalKeywords || ""}
                        onChange={e => setFilters(prev => ({ ...prev, optionalKeywords: e.target.value }))}
                        placeholder="Ex: Docker, AWS, GraphQL"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Excluir competências (NOT)</label>
                      <p className="text-xs text-slate-400">Candidate NÃO deve ter essas habilidades</p>
                      <input
                        type="text"
                        value={filters.excludeKeywords || ""}
                        onChange={e => setFilters(prev => ({ ...prev, excludeKeywords: e.target.value }))}
                        placeholder="Ex: PHP, Delphi"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </>
                )}

                {/* ── Empresas ── */}
                {activeFilterCategory === "empresas" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Cargo Atual</label>
                      <input
                        type="text"
                        value={filters.currentJobTitles || ""}
                        onChange={e => setFilters(prev => ({ ...prev, currentJobTitles: e.target.value }))}
                        placeholder="Ex: Desenvolvedor Sênior, Tech Lead"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Empresa Atual</label>
                      <input
                        type="text"
                        value={filters.currentCompany || ""}
                        onChange={e => setFilters(prev => ({ ...prev, currentCompany: e.target.value }))}
                        placeholder="Ex: Google, Meta, iFood"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Passou por (Empresas Anteriores)</label>
                      <input
                        type="text"
                        value={filters.pastCompany || ""}
                        onChange={e => setFilters(prev => ({ ...prev, pastCompany: e.target.value }))}
                        placeholder="Ex: Nubank, Totvs, Ambev"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Excluir Empresas</label>
                      <input
                        type="text"
                        value={filters.excludeCompany || ""}
                        onChange={e => setFilters(prev => ({ ...prev, excludeCompany: e.target.value }))}
                        placeholder="Ex: Concorrente Ltda"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </>
                )}

                {/* ── Setor de Atuação ── */}
                {activeFilterCategory === "setor" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-sm font-semibold text-slate-800">Setores de Atuação</label>
                    <p className="text-xs text-slate-400">Separe múltiplos setores por vírgula</p>
                    <input
                      type="text"
                      value={filters.industries || ""}
                      onChange={e => setFilters(prev => ({ ...prev, industries: e.target.value }))}
                      placeholder="Ex: Tecnologia, Finanças, Saúde"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]/30 outline-none bg-slate-50 focus:bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Tecnologia", "Finanças", "Saúde", "Varejo", "Indústria", "Educação", "Logística", "Consultoria"].map(setor => (
                        <button
                          key={setor}
                          onClick={() => setFilters(prev => ({ ...prev, industries: prev.industries ? `${prev.industries}, ${setor}` : setor }))}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] text-slate-600 rounded-full text-xs font-medium transition-colors border border-slate-200"
                        >
                          + {setor}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Métricas & Financiamento ── */}
                {activeFilterCategory === "metricas" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Faixa de Faturamento Anual</label>
                      <select
                        value={filters.revenue || "any"}
                        onChange={e => setFilters(prev => ({ ...prev, revenue: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer"
                      >
                        <option value="any">Qualquer faturamento</option>
                        <option value="lt5m">Até R$ 5 milhões</option>
                        <option value="5m50m">R$ 5M – R$ 50 milhões</option>
                        <option value="50m500m">R$ 50M – R$ 500 milhões</option>
                        <option value="gt500m">Acima de R$ 500 milhões</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Rodada de Investimento</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["Bootstrapped", "Seed", "Série A", "Série B", "Série C+", "IPO / Listada"] as const).map(rodada => (
                          <label key={rodada} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-[#7C3AED]/30 transition-colors">
                            <input type="checkbox" className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]" />
                            {rodada}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Sinais de Mercado ── */}
                {activeFilterCategory === "sinais" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Tempo Mínimo no Cargo Atual</label>
                      <select
                        value={filters.timeInRole || "any"}
                        onChange={e => setFilters(prev => ({ ...prev, timeInRole: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer w-64"
                      >
                        <option value="any">Qualquer tempo</option>
                        <option value="gt6m">Mais de 6 meses</option>
                        <option value="gt1y">Mais de 1 ano</option>
                        <option value="gt2y">Mais de 2 anos</option>
                        <option value="gt3y">Mais de 3 anos</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Crescimento Anual da Empresa</label>
                      <select
                        value={filters.companyGrowth || "any"}
                        onChange={e => setFilters(prev => ({ ...prev, companyGrowth: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer w-64"
                      >
                        <option value="any">Qualquer crescimento</option>
                        <option value="gt10">Acima de 10% a.a.</option>
                        <option value="gt30">Acima de 30% a.a.</option>
                        <option value="gt50">Acima de 50% a.a.</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm font-semibold text-slate-800">Propensão à Mudança</label>
                      <select
                        value={filters.likelyToSwitch || "any"}
                        onChange={e => setFilters(prev => ({ ...prev, likelyToSwitch: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white outline-none cursor-pointer w-64"
                      >
                        <option value="any">Qualquer propensão</option>
                        <option value="high">Alta — Open to Work ativo</option>
                        <option value="medium">Média — Possivelmente receptivo</option>
                        <option value="low">Baixa — Estável na empresa atual</option>
                      </select>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setIsFiltersOpen(false); handleRunSearch(); }}
                className="px-5 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold shadow-md shadow-[#7C3AED]/20 hover:opacity-95 transition-all flex items-center gap-2"
              >
                Salvar e Aplicar
                <ArrowUp size={14} className="rotate-45" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT QUERY MODAL */}
      {isEditQueryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[580px] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-900 text-base">Editar Busca</h3>
              <button onClick={() => setIsEditQueryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {/* Content cards */}
            <div className="p-6 space-y-4 bg-slate-50/50">
              
              {/* Query box card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkle size={12} className="text-white fill-white" />
                </div>
                <textarea 
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
                  rows={2}
                  className="flex-1 text-xs text-slate-800 font-semibold leading-relaxed outline-none border-none resize-none bg-transparent"
                />
              </div>

              {/* Filtros detectados */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">IA</div>
                  <span className="text-[11px] text-slate-500 font-medium">Configurei estes <span className="text-slate-800 font-bold">filtros</span> com base no seu perfil buscado ({profiles.length} resultados)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-7 text-[10.5px] font-semibold">
                  {filters.currentJobTitles && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{filters.currentJobTitles}</span>}
                  {filters.location && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{filters.location}</span>}
                  {filters.minYears && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{filters.minYears}+ anos</span>}
                  <button onClick={() => { setIsEditQueryOpen(false); setIsFiltersOpen(true); }} className="text-[#7C3AED] hover:underline font-bold ml-1 text-xs">Editar filtros</button>
                </div>
              </div>

              {/* Critérios detectados */}
              {criteria.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">✨</span>
                    <span className="text-[11px] text-slate-500 font-medium">Adicione estes <span className="text-slate-800 font-bold">critérios</span> para ranquear seus resultados</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-7 text-[10.5px] font-semibold">
                    {criteria.map(c => (
                      <span key={c.id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{c.nome.split(" ").slice(0, 3).join(" ")}...</span>
                    ))}
                    <button onClick={() => { setIsEditQueryOpen(false); setIsCriteriaOpen(true); }} className="text-[#7C3AED] hover:underline font-bold ml-1 text-xs">Editar critérios</button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end">
              <button 
                onClick={handleRunSearch}
                className="bg-[#7C3AED] hover:opacity-95 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm"
              >
                Executar Busca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SHARE LINK PUBLIC MODAL */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-900 text-base">Compartilhe o Link Público desta Pesquisa</h3>
              <button onClick={() => setIsShareOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {/* Descricao & Link display */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Gere um link público que pode ser compartilhado com qualquer pessoa para visualização dos resultados. O link dará acesso à visualização de até 30 perfis de candidatos mais bem ranqueados.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Link Público Gerado</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-500 flex-1 truncate select-all">
                    {generatingShare ? "Gerando link público seguro..." : shareLink || "Carregando..."}
                  </span>
                  {!generatingShare && shareLink && (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" title="Ativo"></span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button 
                onClick={handleCopyLink}
                disabled={generatingShare || !shareLink}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-lg shadow-sm text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy size={13} className="text-slate-500" />
                <span>{shareCopied ? "Copiado!" : "Copiar para área de transferência"}</span>
              </button>
              
              <a 
                href={shareLink || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { if (generatingShare || !shareLink) e.preventDefault(); }}
                className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white font-bold py-2.5 px-4 rounded-lg shadow hover:opacity-95 text-xs transition-all ${
                  (generatingShare || !shareLink) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                <ExternalLink size={13} />
                <span>Abrir URL</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. PAYWALL UPGRADE MODAL */}
      {isPaywallOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Paywall content */}
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-xl font-bold">
                🔒
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">Tenha acesso ilimitado a contatos de candidatos com o Plano Pró</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                Desbloqueie emails, telefones, relatórios completos de fit cultural e exportações sem limitações.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
              <button 
                onClick={() => { setIsPaywallOpen(false); setIsSubscribed(true); }}
                className="w-full bg-[#7C3AED] text-white hover:opacity-95 font-bold py-2.5 rounded-lg text-xs shadow transition-all"
              >
                Fazer Upgrade
              </button>
              <button 
                onClick={() => setIsPaywallOpen(false)}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg text-xs shadow-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
