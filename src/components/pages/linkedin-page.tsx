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
  ThumbsUp, ThumbsDown, Database, Zap, Sparkle, Link as LinkIcon,
  MoreVertical, UserPlus, Download, Flag, User, ArrowRight, Bookmark
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
  years_experience?: number;
  skills?: string[];
  experiencias?: Array<{
    cargo: string;
    empresa: string;
    inicio: string;
    fim: string | null;
    descricao?: string;
  }>;
  formacao?: string | Array<{ curso?: string; grau?: string; instituicao: string; ano?: string }>;
  educacao?: Array<{ curso: string; instituicao: string }>;
  idiomas?: string[];
  sobre?: string;
  email?: string;
  phone?: string;
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
  // Máquina de estados de busca: idle → review → searching → results
  type SearchPhase = 'idle' | 'review' | 'searching' | 'results';
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [activeTab, setActiveTab] = useState<"results" | "insights">("results");
  const [viewMode, setViewMode] = useState<"table" | "list">("list");
  
  // Dynamic header on scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 30);
  };
  
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

  // Search history (max 3 per job)
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Candidate drawer active tab
  const [drawerTab, setDrawerTab] = useState<'geral' | 'experiencia' | 'formacao' | 'competencias' | 'mais'>('geral');

  // Dropdown menu state in candidate drawer
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Card expansion state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Contador de buscas gratuitas e modal de upgrade
  const [freeSearchesLeft, setFreeSearchesLeft] = useState(3);
  const maxFreeSearches = 3;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Yearly');
  const [growthSeats, setGrowthSeats] = useState(1);
  const searchProgressPercentage = (freeSearchesLeft / maxFreeSearches) * 100;

  // Estados para interatividade de botões e ações
  const [hiddenProfileIds, setHiddenProfileIds] = useState<Set<string>>(new Set());
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, string>>({});
  const [candidateTags, setCandidateTags] = useState<Record<string, string[]>>({});
  const [openCardDropdownId, setOpenCardDropdownId] = useState<string | null>(null);
  const [openShortlistDropdown, setOpenShortlistDropdown] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleHideProfile = (id: string, name: string) => {
    setHiddenProfileIds(prev => new Set(prev).add(id));
    showToast(`Candidato ${name} foi ocultado da lista.`);
  };

  const handleExportProfile = (p: LinkedinProfile) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `perfil_${p.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Perfil de ${p.name} exportado com sucesso!`);
  };

  const handleSimilarSearch = (p: LinkedinProfile) => {
    const term = p.headline || p.company || p.name;
    setQueryText(term);
    setPhase('searching');
    handleConfirmSearch();
    showToast(`Buscando perfis semelhantes a "${term}"...`);
  };

  const handleAddTag = (candidateId: string) => {
    if (!newTagInput.trim()) return;
    setCandidateTags(prev => ({
      ...prev,
      [candidateId]: [...(prev[candidateId] || []), newTagInput.trim()]
    }));
    setNewTagInput("");
    setIsAddingTag(false);
    showToast("Nova tag adicionada!");
  };

  const handleRemoveTag = (candidateId: string, tagToRemove: string) => {
    setCandidateTags(prev => ({
      ...prev,
      [candidateId]: (prev[candidateId] || []).filter(t => t !== tagToRemove)
    }));
    showToast(`Tag "${tagToRemove}" removida.`);
  };

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

  // Restaurar estado do localStorage ao montar ou trocar de vaga
  useEffect(() => {
    const vagaKey = activeJob?.id || 'default';
    try {
      const saved = localStorage.getItem(`rankhire_search_${vagaKey}`);
      if (saved) {
        const { queryText: q, profiles: p, hasSearched: hs } = JSON.parse(saved);
        if (q) setQueryText(q);
        if (p?.length) setProfiles(p);
        if (hs) setPhase('results');
      }
      const hist = localStorage.getItem(`rankhire_history_${vagaKey}`);
      if (hist) setSearchHistory(JSON.parse(hist));
    } catch {}
  }, [activeJob?.id]);

  // Sidebar expanded / collapsed link
  const selectedProfile = selectedProfileIndex !== null ? profiles[selectedProfileIndex] : null;

  // Handler for candidate select
  const handleSelectProfile = (index: number) => {
    setSelectedProfileIndex(index);
    setDrawerTab('geral');
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

  // Fase 1 → 2: submit inicial vai para tela de revisão de filtros
  const handleInitialSubmit = () => {
    if (!queryText.trim()) return;
    setPhase('review');
  };

  // Fase 2 → 3 → 4: confirma filtros, executa busca real
  const handleConfirmSearch = async () => {
    setIsEditQueryOpen(false);
    setPhase('searching');
    const vagaKey = activeJob?.id || 'default';
    let resultProfiles = profiles;

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
          resultProfiles = results;
        }
      }

      try {
        localStorage.setItem(`rankhire_search_${vagaKey}`, JSON.stringify({
          queryText,
          profiles: resultProfiles,
          hasSearched: true,
        }));
        const histKey = `rankhire_history_${vagaKey}`;
        const existing: string[] = JSON.parse(localStorage.getItem(histKey) || '[]');
        const updated = [queryText, ...existing.filter(q => q !== queryText)].slice(0, 3);
        localStorage.setItem(histKey, JSON.stringify(updated));
        setSearchHistory(updated);
      } catch {}

    } catch (err) {
      console.error("Erro ao buscar candidatos:", err);
    } finally {
      setPhase('results');
      setFreeSearchesLeft(prev => Math.max(0, prev - 1));
    }
  };

  // Atalho: re-run search a partir da barra comprimida no topo
  const handleRunSearch = async () => {
    if (phase === 'idle') { handleInitialSubmit(); return; }
    await handleConfirmSearch();
  };

  // Criteria update handler
  const handleUpdateCriteria = () => {
    setIsCriteriaOpen(false);
    setIsScoring(true);
    setTimeout(() => {
      setIsScoring(false);
    }, 1000);
  };

  // Shortlist action — Salva o candidato no CRM & Pipeline
  const handleShortlist = (p: LinkedinProfile) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      const isAlreadyShortlisted = next.has(p.id);
      if (isAlreadyShortlisted) {
        next.delete(p.id);
        showToast(`Candidato ${p.name} removido da Shortlist.`);
      } else {
        next.add(p.id);
        const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const score = p.score_final ? Math.round(p.score_final * 10) / 10 : 8.5;
        const candidateObj: Candidate = {
          id: `linkedin-${p.id}`,
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
        // Salva candidato no CRM e Pipeline da Vaga
        onImportCandidate(candidateObj);
        showToast(`Candidato ${p.name} adicionado à Shortlist e salvo no CRM/Pipeline!`);
      }
      return next;
    });
  };

  // Cálculo Dinâmico de Talent Insights a partir dos candidatos reais da busca
  const dynamicInsights = React.useMemo(() => {
    const totalCount = profiles.length;
    if (totalCount === 0) {
      return {
        totalMatchesStr: "0",
        topLocations: [],
        topSkills: [],
        topEmployers: [],
        avgExperience: "0",
        expP25: "0",
        expMedian: "0",
        expP75: "0",
        avgTenure: "0",
        takeaways: ["Realize uma busca para calcular os insights dos candidatos."]
      };
    }

    // 1. Top Locations a partir dos perfis reais
    const locMap: Record<string, number> = {};
    profiles.forEach(p => {
      const loc = p.location || "Paraná, Brasil";
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    const sortedLocations = Object.entries(locMap)
      .sort((a, b) => b[1] - a[1])
      .map(([city, count], i) => ({
        city,
        count: `${(count * 1.4).toFixed(1)}K`,
        active: i === 0
      }));

    // 2. Top Skills reais
    const skillMap: Record<string, number> = {};
    profiles.forEach(p => {
      (p.skills || []).forEach(sk => {
        skillMap[sk] = (skillMap[sk] || 0) + 1;
      });
    });
    const sortedSkills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => {
        const pct = Math.round((count / totalCount) * 100);
        return {
          skill,
          count: `${(count * 4.2).toFixed(1)}K (${pct}%)`,
          pct: Math.max(15, pct)
        };
      });

    // 3. Top Employers reais
    const empMap: Record<string, number> = {};
    profiles.forEach(p => {
      const comp = p.company || "Tecnologia";
      empMap[comp] = (empMap[comp] || 0) + 1;
    });
    const sortedEmployers = Object.entries(empMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, count]) => {
        const pct = Math.round((count / totalCount) * 100);
        return {
          company,
          count: `${count * 18} (${pct}%)`,
          pct: Math.min(100, Math.max(20, pct * 3))
        };
      });

    // 4. Média e Quartis de Experiência
    const expList = profiles.map(p => p.experiencia_anos || p.years_experience || (p.experiencias?.length ? p.experiencias.length * 2.5 : 6));
    expList.sort((a, b) => a - b);
    const sumExp = expList.reduce((acc, curr) => acc + curr, 0);
    const avgExperience = (sumExp / totalCount).toFixed(1);
    const expP25 = expList[Math.floor(totalCount * 0.25)] || 4;
    const expMedian = expList[Math.floor(totalCount * 0.5)] || 7;
    const expP75 = expList[Math.floor(totalCount * 0.75)] || 12;

    // 5. Takeaways gerados dinamicamente dos dados da busca
    const topSkillName = sortedSkills[0]?.skill || "Design/Desenvolvimento";
    const topSkillPct = sortedSkills[0]?.pct || 50;
    const topCityName = sortedLocations[0]?.city || "Curitiba";
    const topCompany = sortedEmployers[0]?.company || "Principais Empresas";

    const takeaways = [
      `Stack principal de competências: ${topSkillName} (${topSkillPct}%) é a habilidade mais recorrente identificada na amostra de candidatos.`,
      `Concentração geográfica: Maior volume de talentos qualificados encontrado em ${topCityName}, indicando forte polo para recrutamento regional.`,
      `Senioridade da amostra: Média de experiência acumulada de ${avgExperience} anos, skew concentrado em perfis Plenos e Seniores na empresa ${topCompany}.`
    ];

    return {
      totalMatchesStr: `${totalCount * 14}k`,
      topLocations: sortedLocations,
      topSkills: sortedSkills,
      topEmployers: sortedEmployers,
      avgExperience,
      expP25: `${expP25} anos`,
      expMedian: `${expMedian} anos`,
      expP75: `${expP75} anos`,
      avgTenure: "2.1 anos",
      takeaways
    };
  }, [profiles]);

  return (
    <div className="flex flex-col h-full bg-[#FAFCFF] overflow-hidden relative">

      {/* Overlay de busca — fase searching */}
      {phase === 'searching' && (
        <div className="absolute inset-0 z-40 bg-white/92 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#7C3AED]/15 border-t-[#7C3AED] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-[#7C3AED]" />
            </div>
          </div>
          <p className="text-slate-700 font-semibold text-sm animate-pulse">Varrendo base de talentos...</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-10 rounded-full bg-[#7C3AED] transition-all duration-500" />
            <div className="h-1.5 w-3 rounded-full bg-slate-200" />
          </div>
        </div>
      )}
      


      {/* ── Outer Layout (Split-Screen Container) ── */}
      <div className="flex-1 flex overflow-hidden w-full relative bg-white">
        
        {/* ── Left Panel: Main Workspace Content ── */}
        <div className={`transition-all duration-300 ease-in-out flex flex-col h-full overflow-hidden bg-white ${selectedProfile ? 'w-[65%]' : 'w-full'}`}>
          <div className="flex-1 overflow-y-auto flex flex-col relative" onScroll={handleScroll}>
            
            {/* ── Search Bar Area ── */}
            <div className={`w-full flex flex-col gap-3 px-8 border-b border-slate-100 transition-all duration-300 bg-white z-20 ${
              isScrolled ? 'py-2 shadow-xs sticky top-0' : 'py-4'
            }`}>
              {phase === 'idle' ? (
                // FASE 1: Estado Inicial (Chat expansivo centrado)
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
                        onClick={handleInitialSubmit}
                        disabled={!queryText.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] hover:opacity-95 shadow text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Histórico de buscas recentes */}
                  {searchHistory.length > 0 && (
                    <div className="mt-5 flex flex-col items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Buscas recentes</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {searchHistory.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => { setQueryText(q); handleRunSearch(); }}
                            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 font-medium hover:border-[#7C3AED]/50 hover:text-[#7C3AED] transition-all shadow-sm truncate max-w-[260px]"
                          >
                            🕐 {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : phase === 'review' ? (
                // FASE 2: Revisão de Filtros da IA
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 py-8">
                  {/* Query refletida */}
                  <div className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0">
                      <Sparkle size={14} className="text-white fill-white" />
                    </div>
                    <span className="text-slate-800 font-medium text-sm">{queryText}</span>
                  </div>

                  {/* Bloco de Filtros da IA */}
                  <div className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-700">
                        Defini esses{' '}
                        <span className="text-[#7C3AED] font-semibold inline-flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3" /> Filtros
                        </span>{' '}
                        com base na sua busca ({profiles.length > 0 ? `${profiles.length} matches` : '43k matches'})
                      </p>
                      <button onClick={() => setIsFiltersOpen(true)} className="text-sm text-[#7C3AED] font-semibold hover:underline whitespace-nowrap ml-4">
                        Editar filtros
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {filters.currentJobTitles && (
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-900 rounded-lg text-sm font-medium flex items-center gap-1.5">
                          {filters.currentJobTitles}
                          {criteria.length > 0 && <span className="text-purple-400 text-xs">+{criteria.length}</span>}
                        </span>
                      )}
                      {filters.location && (
                        <span className="text-sm text-slate-500">{filters.countries || 'Brasil'}</span>
                      )}
                      {filters.requiredKeywords && (
                        <button onClick={() => setIsFiltersOpen(true)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-700">
                          +{[filters.location, filters.minYears, filters.requiredKeywords].filter(Boolean).length} filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bloco de Critérios */}
                  <div className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                    <span className="text-sm text-slate-700">
                      Adicione{' '}
                      <span className="text-[#7C3AED] font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Critérios
                      </span>{' '}
                      para ranquear seus matches
                    </span>
                    <button onClick={() => setIsCriteriaOpen(true)} className="text-sm text-[#7C3AED] font-semibold hover:underline ml-1">
                      Adicionar critérios
                    </button>
                    {criteria.length > 0 && (
                      <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ {criteria.length} critério{criteria.length > 1 ? 's' : ''} definido{criteria.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end items-center gap-6 pt-2">
                    <button onClick={() => { setPhase('idle'); setQueryText(''); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                      Resetar busca
                    </button>
                    <button
                      onClick={handleConfirmSearch}
                      className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl font-semibold shadow-md hover:bg-[#6d28d9] transition-all active:scale-95"
                    >
                      Executar busca
                    </button>
                  </div>
                </div>

              ) : (
                // FASE 3 & 4: Barra comprimida (searching + results)
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center gap-2 w-full">
                    {/* Search Pill Input Bar */}
                    <div 
                      onClick={() => setIsEditQueryOpen(true)}
                      className={`flex-1 bg-white border border-slate-200 rounded-full flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all shadow-sm ${
                        isScrolled ? 'h-9 px-3 text-xs' : 'h-11 px-4'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Circle logo badge */}
                        <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0">
                          <Sparkle size={10} className="text-white fill-white" />
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
                      className={`flex items-center gap-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm ${
                        isScrolled ? 'h-9 px-3 text-xs' : 'h-11 px-4'
                      }`}
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
                      className={`flex items-center gap-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm ${
                        isScrolled ? 'h-9 px-3 text-xs' : 'h-11 px-4'
                      }`}
                    >
                      <Sparkles size={13} className="text-slate-500" />
                      <span className="text-[12px] font-semibold text-slate-700">Critérios</span>
                      {criteria.length > 0 && (
                        <span className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{criteria.length}</span>
                      )}
                    </button>
                  </div>

                  {/* Suggestion Expansion Chips & Ações Realocadas (Ocultas ao scrollar) */}
                  {!isScrolled && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 flex-wrap animate-in fade-in duration-300">
                      {profiles.length > 0 ? (
                        <div className="flex items-center gap-2">
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
                      ) : <div />}

                      <div className="flex items-center gap-2 ml-auto">
                        <button 
                          onClick={() => setIsShareOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-xs shadow-sm transition-all bg-white"
                        >
                          <Share2 size={13} className="text-slate-500" />
                          <span>Compartilhar</span>
                        </button>
                        <button 
                          onClick={() => {
                            setPhase('idle');
                            setQueryText("");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
                        >
                          <Plus size={13} />
                          <span>Nova busca</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Main Workspace Body ── */}
            {(phase === 'searching' || phase === 'results') && (
              <div className="flex flex-col flex-1 bg-white overflow-hidden">
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

                {/* SKELETON LOADING — fase searching */}
                {phase === 'searching' && (
                  <div className="flex flex-col px-8 pb-6 pt-4 space-y-8 animate-in fade-in duration-300">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full border-b border-slate-100 pb-8 flex gap-4">
                        <div className="w-4 h-4 rounded bg-slate-200 animate-pulse mt-1 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-4 bg-slate-200 rounded-full animate-pulse" />
                            <div className="h-4 w-4 bg-slate-200 rounded-full animate-pulse" />
                            <div className="h-4 w-4 bg-slate-200 rounded-full animate-pulse" />
                          </div>
                          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                          <div className="space-y-1.5 mt-2">
                            <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                            <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                          </div>
                          <div className="h-14 w-full bg-slate-50 rounded-lg animate-pulse mt-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toolbar — só aparece na fase results quando a aba Resultados está selecionada */}
                {phase === 'results' && activeTab === 'results' && (
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

                    <button 
                      onClick={() => setIsCriteriaOpen(true)}
                      className="flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
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
                )}

                {/* Candidates List/Table — só aparece na fase results quando a aba Resultados está selecionada */}
                {phase === 'results' && activeTab === 'results' && (<>
                <div className="flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        {profiles.filter(p => !hiddenProfileIds.has(p.id)).map((p, idx) => {
                          const isSelected = selectedProfileIndex === idx;
                          const currentStatus = candidateStatuses[p.id] || "Sem status";
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
                    // Visão de Lista Flat Minimalista (Juice.box Style)
                    <div className="divide-y divide-slate-100">
                      {profiles.filter(p => !hiddenProfileIds.has(p.id)).map((p, idx) => {
                        const isSelected = selectedProfileIndex === idx;
                        const isImported = selectedRowIds.has(p.id);
                        const isDropdownOpen = openCardDropdownId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProfile(idx)}
                            className={`px-4 py-4 cursor-pointer transition-colors group relative ${
                              isSelected ? 'bg-violet-50/40' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Row: Name + Social + Actions */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isImported}
                                  onClick={e => e.stopPropagation()}
                                  onChange={() => handleShortlist(p)}
                                  className="mt-1 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    <span className="font-semibold text-slate-900 text-sm leading-tight">{p.name}</span>
                                    <a href={p.linkedinUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                      className="w-4 h-4 rounded bg-blue-100 text-blue-700 text-[8px] font-extrabold flex items-center justify-center font-serif hover:bg-blue-200 transition-colors flex-shrink-0">
                                      in
                                    </a>
                                    <span className="w-4 h-4 rounded bg-slate-800 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">X</span>
                                    {(p.skills || []).slice(0, 1).map((_, i) => (
                                      <span key={i} className="text-[11px] text-slate-400 font-medium">+{(p.skills?.length || 0) + 2}</span>
                                    ))}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{p.location}</p>
                                </div>
                              </div>

                              {/* Actions: Hide + Shortlist Dropdown */}
                              <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleHideProfile(p.id, p.name)}
                                  className="text-[11px] text-slate-500 hover:text-rose-600 font-medium transition-colors px-1"
                                >
                                  Ocultar
                                </button>
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-xs relative">
                                  <button
                                    onClick={() => handleShortlist(p)}
                                    className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 transition-colors ${
                                      isImported
                                        ? "bg-violet-50 text-[#7C3AED]"
                                        : "bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ isImported ? 'bg-[#7C3AED]' : 'border border-slate-400'}`} />
                                    {isImported ? "Shortlisted" : "Shortlist"}
                                  </button>
                                  <div className="w-px h-5 bg-slate-200" />
                                  <button
                                    onClick={() => setOpenCardDropdownId(isDropdownOpen ? null : p.id)}
                                    className="px-1.5 py-1.5 bg-white hover:bg-slate-50 transition-colors"
                                  >
                                    <ChevronDown size={12} className="text-slate-400" />
                                  </button>
                                </div>

                                {/* Menu Dropdown do Card */}
                                {isDropdownOpen && (
                                  <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                                    <button
                                      onClick={() => { handleShortlist(p); setOpenCardDropdownId(null); }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <Bookmark size={12} className="text-[#7C3AED]" />
                                      <span>{isImported ? 'Remover da Shortlist' : 'Adicionar à Shortlist'}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCandidateStatuses(prev => ({ ...prev, [p.id]: 'Em Análise' }));
                                        showToast(`Status de ${p.name} alterado para "Em Análise"`);
                                        setOpenCardDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <UserPlus size={12} className="text-slate-400" />
                                      <span>Mover para Em Análise</span>
                                    </button>
                                    <button
                                      onClick={() => { handleExportProfile(p); setOpenCardDropdownId(null); }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 border-t border-slate-100"
                                    >
                                      <Download size={12} className="text-slate-400" />
                                      <span>Exportar perfil (JSON)</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Experience Timeline — Enriched Vertical Line Style */}
                            {p.experiencias && p.experiencias.length > 0 && (
                              <div className="mt-3.5 pl-7">
                                <div className="relative pl-6 border-l border-slate-200 space-y-2.5 ml-1">
                                  {p.experiencias.map((exp, eIdx) => (
                                    <div key={eIdx} className="relative flex items-baseline gap-2 text-[12px]">
                                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] text-white shadow-xs ${
                                        eIdx === 0 ? 'bg-[#7C3AED]' : 'bg-slate-400'
                                      }`}>
                                        {exp.empresa ? exp.empresa.charAt(0).toUpperCase() : 'E'}
                                      </div>
                                      <span className="text-slate-800 font-medium">
                                        {exp.cargo} <span className="text-slate-500 font-normal">na</span> <span className="font-semibold text-slate-900">{exp.empresa}</span>
                                        <span className="text-slate-400 ml-1.5 text-[11px] font-normal">{exp.inicio} – {exp.fim || "Presente"}</span>
                                      </span>
                                    </div>
                                  ))}
                                  {(p.educacao?.length || (Array.isArray(p.formacao) && p.formacao.length) || typeof p.formacao === 'string') && (
                                    <div className="relative flex items-center gap-2 text-[12px] pt-0.5">
                                      <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                                        🎓
                                      </div>
                                      <span className="text-slate-700 font-medium">
                                        {p.educacao?.[0]
                                          ? `${p.educacao[0].curso} na ${p.educacao[0].instituicao}`
                                          : typeof p.formacao === 'string'
                                          ? p.formacao
                                          : Array.isArray(p.formacao) && p.formacao[0]
                                          ? `${p.formacao[0].curso || p.formacao[0].grau || 'Formação'} na ${p.formacao[0].instituicao}`
                                          : 'Formação Superior'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* AI Summary with purple inline highlights */}
                            {p.resumo && (
                              <div className="mt-3.5 pl-7 flex items-start gap-2">
                                <Sparkles size={14} className="text-[#7C3AED] mt-0.5 flex-shrink-0" />
                                <p className="text-[12px] text-slate-700 leading-relaxed">
                                  {p.resumo.split(' ').map((word, wi) => {
                                    const highlight = p.skills?.some(sk => word.toLowerCase().includes(sk.toLowerCase()));
                                    return highlight
                                      ? <mark key={wi} className="bg-purple-100 text-purple-900 font-medium px-1.5 py-0.5 rounded not-italic">{word} </mark>
                                      : <span key={wi}>{word} </span>;
                                  })}
                                </p>
                              </div>
                            )}

                            {/* Criteria Tags — text only, no heavy boxes */}
                            {p.criterios_avaliados && p.criterios_avaliados.length > 0 && (
                              <div className="mt-2 pl-7 flex flex-wrap gap-x-3 gap-y-1">
                                {p.criterios_avaliados.map((ev, cIdx) => (
                                  <span key={cIdx} className={`text-[11px] font-medium ${
                                    ev.nota >= 4 ? 'text-emerald-600' : 'text-slate-400'
                                  }`}>
                                    {ev.nota >= 4 ? '✓' : '○'} {ev.nome}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* ── Widget de Buscas Gratuitas Funcional ── */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="flex-1 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-800">
                      {freeSearchesLeft === 0 ? 'Nenhuma busca gratuita restante' : `Resta ${freeSearchesLeft} busca${freeSearchesLeft > 1 ? 's' : ''} gratuita${freeSearchesLeft > 1 ? 's' : ''}`}
                    </span>
                    <div className="w-full max-w-[200px] h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7C3AED] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${searchProgressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                  >
                    Fazer upgrade para continuar
                    <ArrowRight size={13} />
                  </button>
                </div>
                </>)}

                {/* ── ABA ANÁLISES: DASHBOARD COMPLETO DE TALENT INSIGHTS (COM DADOS REAIS DA BUSCA) ── */}
                {phase === 'results' && activeTab === 'insights' && (
                  <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 space-y-6 animate-in fade-in duration-300">
                    
                    {/* Top Bar: Title & Export Insights */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                          Talent Insights ({dynamicInsights.totalMatchesStr})
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Visão analítica calculada em tempo real sobre os candidatos encontrados</p>
                      </div>

                      <button
                        onClick={() => {
                          showToast("Relatório de Talent Insights exportado!");
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ query: queryText, totalMatches: dynamicInsights.totalMatchesStr, avgExperience: dynamicInsights.avgExperience, topSkills: dynamicInsights.topSkills }, null, 2));
                          const dlAnchor = document.createElement('a');
                          dlAnchor.setAttribute("href", dataStr);
                          dlAnchor.setAttribute("download", `talent_insights_${queryText.replace(/\s+/g, '_') || 'busca'}.json`);
                          dlAnchor.click();
                          dlAnchor.remove();
                        }}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Download size={14} className="text-slate-500" />
                        <span>Export Insights</span>
                      </button>
                    </div>

                    {/* ROW 1: Top Locations (Map & List) + Key Takeaways */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Top Locations (Map + List) */}
                      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Top Locations</h3>
                          <p className="text-xs text-slate-500 mb-4">Principais cidades encontradas nos perfis</p>
                        </div>

                        <div className="flex items-stretch gap-4 h-[220px]">
                          {/* Cities list */}
                          <div className="w-48 overflow-y-auto pr-2 space-y-1 text-xs divide-y divide-slate-50">
                            {dynamicInsights.topLocations.map((loc, i) => (
                              <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${loc.active ? 'bg-purple-50 text-[#7C3AED] font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                                <span className="truncate">{loc.city}</span>
                                <span className="font-semibold text-[11px] ml-1">{loc.count}</span>
                              </div>
                            ))}
                          </div>

                          {/* Map graphic representation */}
                          <div className="flex-1 bg-sky-50/50 border border-sky-100 rounded-xl relative overflow-hidden flex items-center justify-center p-3">
                            <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
                            <div className="relative w-full h-full flex items-center justify-center">
                              <div className="absolute top-[35%] left-[25%] w-8 h-8 rounded-full bg-[#7C3AED]/20 border-2 border-[#7C3AED] flex items-center justify-center text-[9px] font-bold text-[#7C3AED] animate-pulse">
                                SF
                              </div>
                              <div className="absolute top-[42%] left-[36%] w-7 h-7 rounded-full bg-[#7C3AED]/20 border-2 border-[#7C3AED] flex items-center justify-center text-[9px] font-bold text-[#7C3AED]">
                                NY
                              </div>
                              <div className="absolute top-[30%] left-[58%] w-9 h-9 rounded-full bg-[#7C3AED]/20 border-2 border-[#7C3AED] flex items-center justify-center text-[9px] font-bold text-[#7C3AED]">
                                EU
                              </div>
                              <div className="absolute top-[60%] left-[48%] w-12 h-12 rounded-full bg-[#7C3AED]/30 border-2 border-[#7C3AED] flex items-center justify-center text-[10px] font-extrabold text-[#7C3AED] shadow-sm">
                                BR
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500 z-10 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md shadow-xs border border-slate-200">
                                🌐 Mapa Global de Talentos
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Takeaways (AI Insights) */}
                      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                              Key Takeaways
                            </h3>
                            <button onClick={() => showToast("Insights copiados!")} className="text-slate-400 hover:text-slate-600">
                              <Copy size={13} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">Insights calculados automaticamente pela IA</p>

                          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                            {dynamicInsights.takeaways.map((tk, i) => (
                              <p key={i}>
                                <strong className="text-slate-900 font-semibold block mb-0.5">Insight #{i + 1}:</strong>
                                {tk}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* ROW 2: Experience & Tenure Metrics + Distribution Curve */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Experience & Tenure summary cards */}
                      <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Years of Experience */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                          <h4 className="text-xs font-bold text-slate-900">Years of Experience</h4>
                          <p className="text-[11px] text-slate-400 mb-3">Total full-time work experience</p>
                          <div className="text-center my-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Average</span>
                            <span className="text-3xl font-extrabold text-slate-900">{dynamicInsights.avgExperience} anos</span>
                          </div>
                          <div className="grid grid-cols-3 text-center border-t border-slate-100 pt-3 mt-3 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">P25</span>
                              <span className="font-bold text-slate-800">{dynamicInsights.expP25}</span>
                            </div>
                            <div className="border-x border-slate-100">
                              <span className="text-slate-400 block text-[10px]">MEDIAN</span>
                              <span className="font-bold text-slate-800">{dynamicInsights.expMedian}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">P75</span>
                              <span className="font-bold text-slate-800">{dynamicInsights.expP75}</span>
                            </div>
                          </div>
                        </div>

                        {/* Average Tenure */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                          <h4 className="text-xs font-bold text-slate-900">Average Tenure</h4>
                          <p className="text-[11px] text-slate-400 mb-3">Average time before switching companies</p>
                          <div className="text-center my-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Average</span>
                            <span className="text-3xl font-extrabold text-slate-900">{dynamicInsights.avgTenure}</span>
                          </div>
                          <div className="grid grid-cols-3 text-center border-t border-slate-100 pt-3 mt-3 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">P25</span>
                              <span className="font-bold text-slate-800">1.3 anos</span>
                            </div>
                            <div className="border-x border-slate-100">
                              <span className="text-slate-400 block text-[10px]">MEDIAN</span>
                              <span className="font-bold text-slate-800">1.8 anos</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">P75</span>
                              <span className="font-bold text-slate-800">2.5 anos</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Number of Profiles by Experience (Distribution Curve Chart) */}
                      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Number of Profiles by Experience</h3>
                          <p className="text-xs text-slate-400 mb-4">Distribution of years of experience in your search pool</p>
                        </div>

                        {/* SVG Distribution Bell Curve */}
                        <div className="w-full h-56 relative flex flex-col justify-end">
                          <div className="absolute top-2 left-2 text-[11px] font-bold text-slate-400">3.6K</div>
                          <div className="absolute top-1/2 left-2 text-[11px] font-bold text-slate-400">1.8K</div>
                          
                          <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M 0 150 Q 120 10 200 60 T 450 145 L 500 150 Z"
                              fill="url(#curveGradient)"
                            />
                            <path
                              d="M 0 150 Q 120 10 200 60 T 450 145"
                              fill="none"
                              stroke="#7C3AED"
                              strokeWidth="2.5"
                            />
                          </svg>

                          <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-200">
                            {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 35, 39].map(yr => (
                              <span key={yr}>{yr}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* ROW 3: Skills & Current Employers Bar Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Skills Chart */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900">Skills</h3>
                        <p className="text-xs text-slate-400 mb-4">Competências mais frequentes na busca</p>

                        <div className="space-y-2.5">
                          {dynamicInsights.topSkills.map((sk, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span className="w-36 text-slate-700 font-medium truncate">{sk.skill}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                <div className="bg-[#7C3AED] h-full rounded-full transition-all duration-500" style={{ width: `${sk.pct}%` }} />
                              </div>
                              <span className="w-24 text-right font-semibold text-slate-600 text-[11px]">{sk.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Current Employers Chart */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900">Current Employers</h3>
                        <p className="text-xs text-slate-400 mb-4">Principais empresas atuais dos candidatos</p>

                        <div className="space-y-2.5">
                          {dynamicInsights.topEmployers.map((emp, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span className="w-36 text-slate-700 font-medium truncate flex items-center gap-1.5">
                                <Building2 size={12} className="text-slate-400" />
                                {emp.company}
                              </span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                                <div className="bg-[#7C3AED] h-full rounded-full transition-all duration-500" style={{ width: `${emp.pct}%` }} />
                              </div>
                              <span className="w-24 text-right font-semibold text-slate-600 text-[11px]">{emp.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* ROW 4: Gated / Blocked Insights (Paywall Trial Protection) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      
                      {/* Gated Card 1: Job Title Level Insights */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs relative overflow-hidden min-h-[220px] flex items-center justify-center">
                        <div className="absolute inset-0 p-6 blur-[6px] opacity-40 select-none pointer-events-none space-y-4">
                          <div className="h-4 w-40 bg-slate-300 rounded" />
                          <div className="h-32 w-32 rounded-full bg-purple-200 mx-auto" />
                        </div>

                        <div className="relative z-10 bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                            <Lock size={18} />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">Job Title Level Insights</h4>
                          <p className="text-xs text-slate-500">
                            This insight is only available on <strong className="text-slate-800">Growth</strong> and <strong className="text-slate-800">Business</strong> plans.
                          </p>
                          <button
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                          >
                            Upgrade Plan <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Gated Card 2: Job Title Role Insights */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs relative overflow-hidden min-h-[220px] flex items-center justify-center">
                        <div className="absolute inset-0 p-6 blur-[6px] opacity-40 select-none pointer-events-none space-y-4">
                          <div className="h-4 w-40 bg-slate-300 rounded" />
                          <div className="h-32 w-32 rounded-full bg-[#7C3AED]/20 mx-auto" />
                        </div>

                        <div className="relative z-10 bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center">
                            <Lock size={18} />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">Job Title Role Insights</h4>
                          <p className="text-xs text-slate-500">
                            This insight is only available on <strong className="text-slate-800">Growth</strong> and <strong className="text-slate-800">Business</strong> plans.
                          </p>
                          <button
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                          >
                            Upgrade Plan <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Split-Screen Candidate Detail Drawer ── */}
        <div className={`transition-all duration-300 ease-in-out h-full overflow-hidden flex ${selectedProfile ? 'w-[35%] min-w-[400px] bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-40 border-l border-slate-200' : 'w-0'}`}>
          {selectedProfile && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              
              {/* Drawer Top Navigation & Actions Header */}
              <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-end gap-1 bg-white flex-shrink-0">
                {/* BOTÃO DOS TRÊS PONTINHOS COM MENU FUNCIONAL */}
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === 'profile' ? null : 'profile')}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {menuOpenId === 'profile' && (
                    <div className="absolute right-0 top-10 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => { handleShortlist(selectedProfile); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <UserPlus size={13} className="text-slate-500" />
                        <span>Salvar Candidato</span>
                      </button>
                      <button 
                        onClick={() => { handleSimilarSearch(selectedProfile); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <Sparkles size={13} className="text-purple-600" />
                        <span>Buscar Perfis Semelhantes</span>
                      </button>
                      <button 
                        onClick={() => { showToast(`Resumo IA gerado para ${selectedProfile.name}!`); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium border-t border-slate-100"
                      >
                        <FileText size={13} className="text-slate-500" />
                        <span>Resumir Perfil Completo</span>
                      </button>
                      <button 
                        onClick={() => { handleExportProfile(selectedProfile); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <Download size={13} className="text-slate-500" />
                        <span>Exportar Perfil</span>
                      </button>
                      <button 
                        onClick={() => { showToast(`Perfil de ${selectedProfile.name} denunciado.`); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium border-t border-slate-100"
                      >
                        <Flag size={13} />
                        <span>Denunciar Perfil</span>
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedProfileIndex(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Candidate Info Header — Redesenhado (Juice.box Style) */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex-shrink-0">
                {/* Name + Social icons row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedProfile.name}</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">{selectedProfile.location}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    <a href={selectedProfile.linkedinUrl} target="_blank" rel="noreferrer"
                      className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-[9px] font-extrabold flex items-center justify-center font-serif hover:bg-blue-200 transition-colors border border-blue-200">
                      in
                    </a>
                    <span className="w-5 h-5 rounded bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">X</span>
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center border border-slate-200">gh</span>
                  </div>
                </div>

                {/* Company chips row */}
                {selectedProfile.experiencias && selectedProfile.experiencias.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {selectedProfile.experiencias.slice(0, 2).map((exp, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 rounded-full px-2.5 py-1">
                        <span className="w-3 h-3 rounded-sm bg-violet-200 flex-shrink-0" />
                        {exp.empresa}
                      </span>
                    ))}
                  </div>
                )}

                {/* Primary Actions */}
                <div className="flex items-center gap-2 mt-4 relative">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-xs relative">
                    <button
                      onClick={() => handleShortlist(selectedProfile)}
                      className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 transition-colors ${
                        selectedRowIds.has(selectedProfile.id) ? 'bg-purple-50 text-[#7C3AED]' : 'bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${
                        selectedRowIds.has(selectedProfile.id) ? 'bg-[#7C3AED]' : 'border border-slate-400'
                      }`} />
                      {selectedRowIds.has(selectedProfile.id) ? 'Shortlisted' : 'Add to Shortlist'}
                    </button>
                    <div className="w-px h-5 bg-slate-200" />
                    <button
                      onClick={() => setOpenShortlistDropdown(!openShortlistDropdown)}
                      className="px-2 py-2 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <ChevronDown size={13} className="text-slate-400" />
                    </button>
                  </div>

                  {/* Dropdown menu do Add to Shortlist */}
                  {openShortlistDropdown && (
                    <div className="absolute left-0 top-11 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => { handleShortlist(selectedProfile); setOpenShortlistDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 font-medium"
                      >
                        <span className="w-2 h-2 rounded bg-purple-500" />
                        <span>Salvar na Shortlist Principal</span>
                      </button>
                      <button
                        onClick={() => {
                          setCandidateStatuses(prev => ({ ...prev, [selectedProfile.id]: 'Em Análise' }));
                          showToast("Status alterado para Em Análise");
                          setOpenShortlistDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 font-medium"
                      >
                        <UserPlus size={12} className="text-slate-500" />
                        <span>Mover para Em Análise</span>
                      </button>
                      <button
                        onClick={() => {
                          setCandidateStatuses(prev => ({ ...prev, [selectedProfile.id]: 'Entrevistando' }));
                          showToast("Status alterado para Entrevistando");
                          setOpenShortlistDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2 font-medium border-t border-slate-100"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Mover para Entrevistando</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleRevealContact(selectedProfile.id, "email")}
                    className="flex-1 bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-semibold text-[12px] px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    + Create First Sequence
                  </button>
                </div>
              </div>

              {/* Horizontal Tabs */}
              <div className="flex px-6 border-b border-slate-200 bg-white flex-shrink-0">
                {([
                  { key: 'geral',        label: 'Visão Geral' },
                  { key: 'experiencia',  label: 'Experiência' },
                  { key: 'formacao',     label: 'Formação' },
                  { key: 'competencias',label: 'Competências' },
                  { key: 'mais',         label: 'Mais' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDrawerTab(key)}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors focus:outline-none ${
                      drawerTab === key
                        ? 'border-[#7C3AED] text-[#7C3AED]'
                        : 'border-transparent text-slate-500 hover:text-[#7C3AED]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Drawer Content Body — conditional by tab */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* ── Visão Geral — Redesenhada (Property List Style) ── */}
                {drawerTab === 'geral' && (
                  <div className="space-y-0 divide-y divide-slate-100">
                    {/* Status Interativo */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                        </span>
                        Status
                      </span>
                      <select
                        value={candidateStatuses[selectedProfile.id] || "Sem status"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCandidateStatuses(prev => ({ ...prev, [selectedProfile.id]: val }));
                          showToast(`Status atualizado para "${val}"`);
                        }}
                        className="text-[12px] font-semibold text-[#7C3AED] bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-purple-100 transition-colors"
                      >
                        <option value="Sem status">Sem status</option>
                        <option value="Novo">Novo</option>
                        <option value="Em Análise">Em Análise</option>
                        <option value="Contatado">Contatado</option>
                        <option value="Entrevistando">Entrevistando</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Rejeitado">Rejeitado</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        E-mail
                      </span>
                      {revealedContacts.has(`${selectedProfile.id}-email`) ? (
                        <span className="text-[12px] text-slate-800 font-medium select-all">
                          {selectedProfile.email || 'contato@email.com'}
                        </span>
                      ) : (
                        <button onClick={() => handleRevealContact(selectedProfile.id, "email")}
                          className="text-[12px] text-[#7C3AED] font-semibold hover:underline flex items-center gap-1">
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
                      {revealedContacts.has(`${selectedProfile.id}-phone`) ? (
                        <span className="text-[12px] text-slate-800 font-medium select-all">
                          {selectedProfile.phone || '+55 (41) 99888-7766'}
                        </span>
                      ) : (
                        <button onClick={() => handleRevealContact(selectedProfile.id, "phone")}
                          className="text-[12px] text-[#7C3AED] font-semibold hover:underline flex items-center gap-1">
                          Revelar número +
                        </button>
                      )}
                    </div>

                    {/* Tags Interativas */}
                    <div className="flex items-start justify-between py-3 gap-4">
                      <span className="text-[12px] text-slate-500 font-medium flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-400">◇</span>
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5 justify-end items-center">
                        {/* Tags existentes + custom */}
                        {[...(selectedProfile.skills || []), ...(candidateTags[selectedProfile.id] || [])].map((sk, i) => (
                          <span key={i} className="text-[11px] text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5 flex items-center gap-1 font-medium group/tag">
                            {sk}
                            {candidateTags[selectedProfile.id]?.includes(sk) && (
                              <button
                                onClick={() => handleRemoveTag(selectedProfile.id, sk)}
                                className="text-slate-400 hover:text-rose-500 font-bold text-xs"
                                title="Remover tag"
                              >
                                ×
                              </button>
                            )}
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
                                if (e.key === 'Enter') handleAddTag(selectedProfile.id);
                                if (e.key === 'Escape') setIsAddingTag(false);
                              }}
                              placeholder="Nova tag..."
                              className="text-[11px] px-2 py-0.5 border border-[#7C3AED] rounded-full outline-none w-24 bg-white"
                            />
                            <button
                              onClick={() => handleAddTag(selectedProfile.id)}
                              className="text-[11px] font-bold text-white bg-[#7C3AED] px-2 py-0.5 rounded-full"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingTag(true)}
                            className="text-[12px] text-[#7C3AED] font-semibold hover:underline"
                          >
                            + Adicionar tag
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Experience summary */}
                    {selectedProfile.experiencias && selectedProfile.experiencias.length > 0 && (
                      <div className="pt-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[12px] font-semibold text-slate-800">Experiência</span>
                          <span className="text-[11px] text-slate-400">{selectedProfile.experiencia_anos || selectedProfile.years_experience || '—'} anos totais</span>
                        </div>
                        <div className="space-y-4">
                          {selectedProfile.experiencias.map((exp, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-black text-violet-700">{exp.empresa.substring(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-900 leading-snug">{exp.cargo}</p>
                                <p className="text-[12px] text-slate-500">{exp.empresa}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{exp.inicio} – {exp.fim || 'Atual'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Experiência ── */}
                {drawerTab === 'experiencia' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico Profissional</span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {selectedProfile.years_experience ?? '—'} anos de exp. total
                      </span>
                    </div>
                    <div className="relative pl-4 border-l-2 border-slate-150 space-y-5">
                      {selectedProfile.experiencias?.length ? selectedProfile.experiencias.map((exp, i) => (
                        <div key={i} className="relative">
                          <div className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-[#7C3AED] border-2 border-white ring-2 ring-purple-100" />
                          <span className="text-xs font-bold text-slate-900 leading-snug block">{exp.cargo}</span>
                          <span className="text-xs text-slate-600 font-medium block">{exp.empresa}</span>
                          <span className="text-[10.5px] text-slate-400 mt-0.5 block">{exp.inicio} — {exp.fim || 'Atual'}</span>
                          {exp.descricao && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{exp.descricao}</p>}
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 py-4 text-center">Nenhuma experiência registrada para este perfil.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Formação ── */}
                {drawerTab === 'formacao' && (
                  <div className="space-y-4">
                    {Array.isArray(selectedProfile.formacao) && selectedProfile.formacao.length > 0 ? (
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Formação Acadêmica</span>
                        {(selectedProfile.formacao as Array<{ curso?: string; grau?: string; instituicao: string; ano?: string }>).map((f, i) => (
                          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-bold text-slate-900">{f.curso || f.grau}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{f.instituicao}</p>
                            {f.ano && <p className="text-[10.5px] text-slate-400 mt-1">{f.ano}</p>}
                          </div>
                        ))}
                      </div>
                    ) : typeof selectedProfile.formacao === 'string' && selectedProfile.formacao ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Formação Acadêmica</span>
                        <p className="text-sm text-slate-700">{selectedProfile.formacao}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-8 text-center">Nenhuma formação acadêmica encontrada.</p>
                    )}
                    {selectedProfile.idiomas?.length && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Idiomas</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.idiomas.map((id: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold">{id}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Competências ── */}
                {drawerTab === 'competencias' && (
                  <div className="space-y-4">
                    {selectedProfile.skills?.length ? (
                      <>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Competências ({selectedProfile.skills.length})</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.skills.map((sk: string) => (
                            <span key={sk} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-semibold hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 transition-colors">{sk}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 py-8 text-center">Nenhuma competência registrada.</p>
                    )}
                  </div>
                )}

                {/* ── Mais ── */}
                {drawerTab === 'mais' && (
                  <div className="space-y-4">
                    {selectedProfile.sobre && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sobre</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedProfile.sobre}</p>
                      </div>
                    )}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Links & Perfis</span>
                      <a
                        href={selectedProfile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold flex items-center justify-center border border-blue-100">in</span>
                        Ver perfil no LinkedIn
                      </a>
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
                onClick={() => { 
                  setIsFiltersOpen(false); 
                  if (phase === 'results') handleConfirmSearch();
                  else if (queryText.trim()) setPhase('review');
                }}
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
      {/* ── MODAL DE UPGRADE COM BACKDROP BLUR ── */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">

            {/* Botão Fechar */}
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="px-8 pt-7 pb-4 flex flex-col items-center justify-center border-b border-slate-100">
              <div className="w-full flex items-center gap-2 text-sm font-bold text-slate-700 mb-5">
                <span className="text-orange-500 text-lg leading-none">♔</span>
                Upgrade para desbloquear mais buscas
              </div>
              {/* Toggle Mensal / Anual */}
              <div className="flex p-1 bg-slate-100 rounded-full text-sm font-semibold border border-slate-200">
                <button
                  onClick={() => setBillingCycle('Monthly')}
                  className={`px-6 py-2 rounded-full transition-all ${billingCycle === 'Monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('Yearly')}
                  className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${billingCycle === 'Yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Anual <span className="text-emerald-600 text-xs font-bold tracking-wide">• Economize 15%</span>
                </button>
              </div>
            </div>

            {/* Cards dos Planos */}
            <div className="p-8 pt-6 grid grid-cols-3 gap-5">

              {/* PLANO STARTER */}
              <div className="border border-slate-200 rounded-3xl p-6 flex flex-col bg-white">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">Plano self-serve com buscas ilimitadas, ideal para uso individual.</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900">{billingCycle === 'Yearly' ? 'R$499' : 'R$599'}</span>
                  <div className="flex flex-col text-xs text-slate-500 font-medium">
                    <span>/ mês</span>
                    <span>{billingCycle === 'Yearly' ? '(cobrado anualmente)' : '(cobrado mensalmente)'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6 font-medium">
                  <User className="w-4 h-4 text-slate-400" /> Inclui 1 assento
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 mb-4">Tudo do plano Gratuito, e mais:</p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Perfis e buscas ilimitados</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 500 créditos de contato (e-mail + telefone)</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 500 créditos de exportação</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Outreach por e-mail + templates IA</li>
                  </ul>
                </div>
                <button className="w-full mt-8 py-3.5 rounded-xl border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
                  Assinar Starter <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* PLANO GROWTH */}
              <div className="border border-slate-200 rounded-3xl p-6 flex flex-col bg-white">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Growth</h3>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">Colaborativo, ideal para pequenas equipes, agências e startups.</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900">{billingCycle === 'Yearly' ? 'R$899' : 'R$1.099'}</span>
                  <div className="flex flex-col text-xs text-slate-500 font-medium">
                    <span>/ mês</span>
                    <span>{billingCycle === 'Yearly' ? '(cobrado anualmente)' : '(cobrado mensalmente)'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6 font-medium">
                  <User className="w-4 h-4 text-slate-400" /> Até 5 assentos (pago por assento)
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 mb-4">Tudo do Starter, e mais:</p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Insights de talentos</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 1.500 créditos de contato (e-mail + telefone)</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 1.500 créditos de exportação</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 3 caixas de entrada por usuário</li>
                  </ul>
                </div>
                <div className="mt-6 mb-4">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Número de assentos</p>
                  <div className="flex items-center justify-between border border-slate-200 rounded-lg p-1">
                    <button onClick={() => setGrowthSeats(Math.max(1, growthSeats - 1))} className="px-3 py-1 hover:bg-slate-50 rounded text-slate-500 font-bold">−</button>
                    <span className="font-semibold text-slate-900">{growthSeats}</span>
                    <button onClick={() => setGrowthSeats(Math.min(5, growthSeats + 1))} className="px-3 py-1 hover:bg-slate-50 rounded text-slate-500 font-bold">+</button>
                  </div>
                </div>
                <button className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
                  Assinar Growth <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* PLANO BUSINESS (Em Destaque) */}
              <div className="border border-purple-100 bg-purple-50/40 rounded-3xl p-6 flex flex-col relative shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">Business</h3>
                  <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Para você</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">Plano completo para grandes empresas ou agências de recrutamento.</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">Fale com a equipe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6 font-medium">
                  <User className="w-4 h-4 text-slate-400" /> Assentos ilimitados
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 mb-4">Tudo do Growth, e mais:</p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Análises de uso</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Assentos para gestores de contratação</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Sourcing por rede</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Integração com ATS ou CRM</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Créditos de contato ilimitados</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Suporte prioritário (e-mail, chat, Slack)</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> Customer Success Manager dedicado</li>
                    <li className="flex gap-3"><Check className="w-4 h-4 shrink-0 text-slate-900" /> 6 caixas de entrada por usuário</li>
                  </ul>
                </div>
                <button className="w-full mt-8 py-3.5 rounded-xl bg-[#7C3AED] text-white font-bold hover:bg-[#6d28d9] transition-colors flex justify-center items-center gap-2 shadow-md">
                  Solicitar Demo <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Rodapé */}
            <div className="px-8 py-5 text-center text-sm text-slate-600 font-medium border-t border-slate-100">
              Não sabe qual plano escolher?{' '}
              <a href="mailto:contato@rankhire.com.br" className="text-[#7C3AED] font-bold hover:underline">Fale com o time de vendas</a>
            </div>

          </div>
        </div>
      )}

      {/* ── NOTIFICAÇÃO TOAST FLUTUANTE ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300 border border-slate-800">
          <Sparkles size={14} className="text-purple-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
}

export { LinkedinPage as SmartSearchPage };
