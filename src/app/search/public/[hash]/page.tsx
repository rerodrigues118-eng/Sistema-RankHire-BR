"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert, Mail, Phone, Lock, Eye, AlertCircle } from "lucide-react";

type PublicCandidate = {
  id: string;
  nome: string;
  cargo: string;
  score: number;
  resumo?: string;
  match?: string;
  email: string;
  telefone: string;
  cidade?: string;
  formacao?: string;
  skills?: string[];
};

export default function PublicSharePage() {
  const params = useParams();
  const hash = params.hash as string;

  const [candidates, setCandidates] = useState<PublicCandidate[]>([]);
  const [criterios, setCriterios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PublicCandidate | null>(null);

  useEffect(() => {
    async function loadShare() {
      try {
        const res = await fetch(`/api/search/public?hash=${hash}`);
        const data = await res.json();
        if (res.ok) {
          setCandidates(data.candidates || []);
          setCriterios(data.criterios || []);
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
    }
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500" />
        <h1 className="text-xl font-bold text-gray-900">Acesso Indisponível</h1>
        <p className="text-sm text-gray-500 max-w-md">{error}</p>
        <Link href="/" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
          Ir para a Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium Top Header */}
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-slate-200 rounded-md bg-indigo-50 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-[1px]" />
          </div>
          <span className="text-gray-900 font-extrabold text-base tracking-tight">RankHire BR</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold tracking-wide uppercase">
            Visualização Pública
          </span>
        </div>

        <Link
          href="/cadastro"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Experimentar Grátis
        </Link>
      </header>

      {/* Hero Banner Warning */}
      <div className="bg-amber-50 border-b border-amber-200/50 py-3.5 px-8 text-center text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
        <AlertCircle size={14} className="text-amber-600 shrink-0" />
        <span>Para revelar os dados de contato completos e contratar, crie sua conta e faça upgrade para um plano ativo.</span>
      </div>

      {/* Main Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: List of Candidates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Top {candidates.length} Talentos</h2>
            <span className="text-xs text-gray-500">Ordenados por compatibilidade</span>
          </div>

          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                className={`p-5 rounded-2xl bg-white border cursor-pointer transition flex justify-between items-start gap-4 hover:shadow-md ${
                  selectedCandidate?.id === c.id ? "border-indigo-600 ring-1 ring-indigo-600" : "border-gray-200"
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="font-bold text-gray-900 truncate text-[15px]">{c.nome}</h3>
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">{c.cargo}</p>
                  {c.resumo && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{c.resumo}</p>}
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-extrabold text-indigo-700 leading-none">{(c.score * 20).toFixed(0)}%</span>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase mt-0.5 tracking-wider">Score</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Eye size={12} /> Detalhes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Selected Candidate Details */}
        <div className="lg:col-span-1">
          {selectedCandidate ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm sticky top-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  {selectedCandidate.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCandidate.nome}</h3>
                  <p className="text-sm text-gray-500">{selectedCandidate.cargo}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">
                  Compatibilidade: {(selectedCandidate.score * 20).toFixed(0)}%
                </div>
              </div>

              {/* Masked Contact Details Card */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4.5 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Informações de Contato</h4>
                
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="font-mono">{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="font-mono">{selectedCandidate.telefone}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/cadastro"
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Lock size={13} />
                    Revelar Contato
                  </Link>
                </div>
              </div>

              {/* Experience Details */}
              <div className="space-y-4 text-sm text-gray-700">
                {selectedCandidate.cidade && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Localização</h4>
                    <p className="font-medium text-gray-800">{selectedCandidate.cidade}</p>
                  </div>
                )}
                {selectedCandidate.formacao && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Formação Acadêmica</h4>
                    <p className="font-medium text-gray-800">{selectedCandidate.formacao}</p>
                  </div>
                )}
                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Principais Competências</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.skills.map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center text-gray-400 space-y-3 sticky top-6 shadow-sm">
              <Eye className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm font-medium">Selecione um candidato da lista para inspecionar seus detalhes.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
