"use client";

import React, { useEffect, useState } from "react";
import {
  X, ExternalLink, Star, CheckCircle2, EyeOff,
  ChevronDown, ChevronUp, Briefcase, GraduationCap, 
  Languages, Sparkles, Building2, MapPin
} from "lucide-react";

interface Experiencia {
  cargo: string;
  empresa: string;
  inicio: string;
  fim: string | null;
}

interface CriterioScore {
  nome: string;
  peso: number;
  nota: number;
  justificativa: string;
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
  criterios_avaliados?: CriterioScore[];
  resumo?: string;
  experiencia_anos?: number;
  skills?: string[];
  experiencias?: Experiencia[];
  formacao?: string;
  idiomas?: string[];
  sobre?: string;
  jaVisto?: boolean;
}

interface LinkedinPreviewDrawerProps {
  profile: LinkedinProfile | null;
  onClose: () => void;
  onShortlist?: (profile: LinkedinProfile) => void;
  onAddPipeline?: (profile: LinkedinProfile) => void;
  onHide?: (profile: LinkedinProfile) => void;
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const hash = name.charCodeAt(0) % 6;
  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-fuchsia-600',
  ];
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradients[hash]} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444';
  const r = 30, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="40" y="44" textAnchor="middle" fill={color} fontSize="15" fontWeight="bold">{score.toFixed(1)}</text>
      </svg>
      <span className="text-[11px] font-medium" style={{ color }}>
        {score >= 4.5 ? 'Excelente' : score >= 3.5 ? 'Ótimo' : score >= 3 ? 'Bom' : 'Básico'}
      </span>
    </div>
  );
}

function formatPeriod(inicio: string, fim: string | null): string {
  if (!inicio) return '';
  const start = new Date(inicio);
  const end = fim ? new Date(fim) : new Date();
  const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const dur = years > 0 ? `${years} ano${years > 1 ? 's' : ''}${rem > 0 ? ` ${rem} mês${rem > 1 ? 'es' : ''}` : ''}` : `${rem} mês${rem !== 1 ? 'es' : ''}`;
  const startStr = start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  const endStr = fim ? new Date(fim).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'Atual';
  return `${startStr} — ${endStr} · ${dur}`;
}

export default function LinkedinPreviewDrawer({ profile, onClose, onShortlist, onAddPipeline, onHide }: LinkedinPreviewDrawerProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Marca o perfil como visto ao abrir
  useEffect(() => {
    if (!profile) return;
    fetch('/api/perfis-vistos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedin_url: profile.linkedinUrl,
        nome: profile.name,
        cargo: profile.headline,
        empresa: profile.company,
      })
    }).catch(() => {});
  }, [profile]);

  if (!profile) return null;

  const notaColor = (nota: number) =>
    nota >= 4 ? 'bg-emerald-100 text-emerald-700' : nota >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 shadow-sm">
          <X className="w-4 h-4" />
        </button>

        {/* Scroll */}
        <div className="flex-1 overflow-y-auto">

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 pt-10 pb-6 text-white">
            <div className="flex items-start gap-4">
              <Initials name={profile.name} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold leading-tight">{profile.name}</h2>
                <p className="text-indigo-200 text-[13px] mt-0.5">{profile.headline}</p>
                {profile.company && (
                  <div className="flex items-center gap-1.5 mt-2 text-indigo-100 text-[12px]">
                    <Building2 className="w-3.5 h-3.5" />
                    {profile.company}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1.5 mt-1 text-indigo-100 text-[12px]">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </div>
                )}
              </div>
              {profile.score_final && <ScoreGauge score={profile.score_final} />}
            </div>

            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white text-[13px] font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir no LinkedIn
            </a>
          </div>

          {/* Critérios avaliados */}
          {profile.criterios_avaliados && profile.criterios_avaliados.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-3">Avaliação por Critério</h3>
              <div className="space-y-2">
                {profile.criterios_avaliados.map((c, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-800">{c.nome}</span>
                        <span className="text-[10px] text-gray-400">peso {c.peso}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{c.justificativa}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[12px] font-bold ${notaColor(c.nota)}`}>
                      {c.nota.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo IA */}
          {profile.resumo && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Resumo IA</h3>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{profile.resumo}</p>
            </div>
          )}

          {/* Experiência */}
          {profile.experiencias && profile.experiencias.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Experiência</h3>
              </div>
              <div className="space-y-4">
                {profile.experiencias.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">{exp.cargo}</p>
                      <p className="text-[13px] text-gray-600">{exp.empresa}</p>
                      {exp.inicio && <p className="text-[12px] text-gray-400 mt-0.5">{formatPeriod(exp.inicio, exp.fim)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formação */}
          {profile.formacao && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Formação</h3>
              </div>
              <p className="text-[13px] text-gray-700">{profile.formacao}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-3">Habilidades</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 20).map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[12px] font-medium rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {profile.idiomas && profile.idiomas.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-gray-400" />
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Idiomas</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.idiomas.map((lang, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[12px] font-medium rounded-full">{lang}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sobre */}
          {profile.sobre && (
            <div className="px-6 py-4">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-2">Sobre</h3>
              <p className={`text-[13px] text-gray-700 leading-relaxed ${!aboutExpanded ? 'line-clamp-3' : ''}`}>
                {profile.sobre}
              </p>
              {profile.sobre.length > 200 && (
                <button onClick={() => setAboutExpanded(!aboutExpanded)} className="flex items-center gap-1 mt-2 text-[12px] text-indigo-600 font-medium">
                  {aboutExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Ver menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver mais</>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-gray-100 px-6 py-4 bg-white">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => { onShortlist?.(profile); }}
              className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[13px] font-semibold hover:bg-amber-100 transition-colors"
            >
              <Star className="w-4 h-4" /> Shortlist
            </button>
            <button
              onClick={() => { onAddPipeline?.(profile); }}
              className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Pipeline
            </button>
          </div>
          <button
            onClick={() => { onHide?.(profile); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-red-500 text-[12px] transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" /> Ocultar perfil
          </button>
        </div>
      </div>
    </div>
  );
}
