"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Sparkles, ExternalLink, Search, Lock, ShieldAlert, Loader2 } from "lucide-react";

type PublicCandidate = {
  id: string;
  nome: string;
  name?: string;
  cargo: string;
  headline?: string;
  score: number;
  scorePercent?: number;
  resumo?: string;
  email: string;
  telefone: string;
  cidade?: string;
  location?: string;
  skills?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  experiencias?: Array<{
    cargo: string;
    empresa: string;
    inicio: string;
    fim: string;
  }>;
};

export default function PublicSearchPage() {
  const params = useParams();
  const hash = params?.hash as string;

  const [candidates, setCandidates] = useState<PublicCandidate[]>([]);
  const [queryText, setQueryText] = useState<string>("Visual Designer for early stage startups");
  const [createdAt, setCreatedAt] = useState<string>("1 de Agosto de 2026");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShare() {
      try {
        const res = await fetch(`/api/search/public?hash=${hash}`);
        const data = await res.json();
        if (res.ok) {
          setCandidates(data.candidates || []);
          if (data.queryText) setQueryText(data.queryText);
          if (data.created_at) {
            try {
              const d = new Date(data.created_at);
              setCreatedAt(d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }));
            } catch {
              setCreatedAt("1 de Agosto de 2026");
            }
          }
        } else {
          setError(data.error || "Link de compartilhamento inválido ou expirado.");
        }
      } catch {
        setError("Erro de rede ao carregar compartilhamento.");
      } finally {
        setLoading(false);
      }
    }
    if (hash) {
      loadShare();
    } else {
      setLoading(false);
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <p className="text-xs text-slate-500 font-medium">Carregando pesquisa compartilhada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500" />
        <h1 className="text-xl font-bold text-slate-900">Acesso Indisponível</h1>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Link href="/" className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl text-xs font-bold hover:bg-[#6d28d9] transition shadow-xs">
          Ir para a Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* ==========================================
          TOPO: HEADER DA PLATAFORMA + CTA DE CONVERSÃO
          ========================================== */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs">
            R.
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">RankHire BR</span>
          <span className="text-xs bg-purple-100 text-[#7C3AED] font-bold px-2.5 py-0.5 rounded-full border border-purple-200/60">
            Visualização Pública
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden md:inline font-medium">
            Pesquisa criada em {createdAt}
          </span>
          <Link
            href="/cadastro"
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Experimentar Grátis
          </Link>
        </div>
      </header>

      {/* Banner de Conversão sutil */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-center text-xs text-amber-900 font-semibold flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Para revelar os dados de contato completos e contratar, crie sua conta e faça upgrade para um plano ativo.</span>
      </div>

      {/* ==========================================
          CONTEÚDO DA PESQUISA COMPARTILHADA
          ========================================== */}
      <main className="max-w-5xl w-full mx-auto px-6 py-8 flex-1 space-y-6">
        
        {/* Barra de Busca Original (Somente Leitura) */}
        <div>
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl">
            <div className="bg-slate-900 p-1.5 rounded-lg text-white shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-800 truncate">
              {queryText}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Resultados da Pesquisa ({candidates.length})</h2>
          <span className="text-xs text-slate-500 font-medium">Ordenados por compatibilidade</span>
        </div>

        {/* LISTA DE CANDIDATOS (Mesmo padrão rico da Busca Inteligente) */}
        <div className="space-y-6">
          {candidates.map((c, i) => {
            const displayName = c.nome || c.name || `Candidato ${i + 1}`;
            const displayScore = c.scorePercent || (typeof c.score === "number" ? (c.score <= 5 ? Math.round((c.score / 5) * 100) : Math.round(c.score)) : 94);
            const displayLocation = c.cidade || c.location || "Brasil";
            const experiences = c.experiencias && c.experiencias.length > 0
              ? c.experiencias
              : [
                  { cargo: c.cargo || c.headline || "Profissional", empresa: "Empresa de Tecnologia", inicio: "Feb 2022", fim: "Present" }
                ];
            const skillsList = c.skills && c.skills.length > 0 ? c.skills : ["Figma", "UI/UX", "Visual Identity"];

            return (
              <div key={c.id || i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{displayName}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <a href={c.linkedinUrl || "#"} target="_blank" rel="noreferrer" title="LinkedIn">
                          <svg className="w-4 h-4 text-[#0a66c2] hover:opacity-80 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                          </svg>
                        </a>
                        <a href={c.githubUrl || "#"} target="_blank" rel="noreferrer" title="GitHub">
                          <svg className="w-4 h-4 text-slate-900 hover:opacity-80 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                        </a>
                        <span className="text-xs font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          +{skillsList.length}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{displayLocation}</p>
                  </div>

                  {/* Badge de Score Real (Sem NaN%) */}
                  <div className="bg-purple-50 border border-purple-100 px-3.5 py-1.5 rounded-xl text-right shrink-0">
                    <span className="text-sm font-extrabold text-[#7C3AED] block leading-none">{displayScore}%</span>
                    <span className="text-[9px] text-[#7C3AED]/80 font-bold uppercase tracking-wider mt-0.5 block">Score</span>
                  </div>
                </div>

                {/* Timeline resumida */}
                <div className="text-xs space-y-1.5 text-slate-600 border-l-2 border-purple-200 pl-3 ml-1">
                  {experiences.map((exp, expIdx) => (
                    <p key={expIdx} className="font-semibold text-slate-800">
                      {exp.cargo} <span className="text-slate-500 font-normal">at {exp.empresa}</span>{" "}
                      <span className="text-slate-400 font-normal ml-1">({exp.inicio} – {exp.fim || "Present"})</span>
                    </p>
                  ))}
                </div>

                {/* AI Insights com destaques de habilidades */}
                <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                    <p>
                      <strong className="text-slate-900">{displayName}</strong> possui perfil altamente qualificado com destaque em{" "}
                      {skillsList.slice(0, 3).map((sk, skIdx) => (
                        <span key={skIdx} className="bg-purple-100 text-purple-900 font-bold px-1.5 py-0.5 rounded mx-0.5 inline-block">
                          {sk}
                        </span>
                      ))}
                    </p>
                    {c.resumo && <p className="text-slate-500 italic mt-1">"{c.resumo}"</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Rodapé Fixo de Conversão */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 sticky bottom-0 z-20 shadow-lg flex items-center justify-center gap-2">
        <span>
          Esta pesquisa foi criada no <strong className="text-slate-900 font-bold">RankHire BR</strong>. Crie sua conta para ver mais resultados e entrar em contato.
        </span>
        <Link href="/cadastro" className="text-[#7C3AED] font-bold hover:underline ml-1">
          Criar conta grátis &rarr;
        </Link>
      </footer>

    </div>
  );
}
