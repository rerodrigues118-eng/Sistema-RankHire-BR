"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Globe, GraduationCap, Briefcase, Languages, Search, Sparkles } from "lucide-react";

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const IDIOMAS_OPTS = ['Português','Inglês','Espanhol','Mandarim','Alemão','Francês','Italiano','Outro'];
const NIVEL_OPTS = ['Básico','Intermediário','Avançado','Fluente','Nativo'];

const UNIVERSIDADES_BR = [
  'USP','UNICAMP','FGV','PUC-SP','PUC-RJ','PUC-MG','PUC-RS','PUC-PR',
  'UFMG','UFRJ','UFRGS','UnB','ESPM','Insper','FEI','Mackenzie',
  'UNESP','UNIFESP','UERJ','UFRN','UFC','UFPE','UFBA','UFSC','UFF',
];

interface Idioma { idioma: string; nivel: string; }
interface BoolTerm { valor: string; operador: 'AND' | 'OR' | 'NOT'; }

interface FiltersState {
  expMin: string;
  expMax: string;
  cidade: string;
  estado: string;
  raio: 'cidade' | 'estado' | 'nacional' | 'remoto';
  jobTitles: string[];
  somenteCargotAtual: boolean;
  cargosAnteriores: string[];
  keywords: string[];
  universidades: string[];
  uniMode: 'incluir' | 'excluir';
  idiomas: Idioma[];
  boolMode: 'visual' | 'avancado';
  boolTerms: BoolTerm[];
  boolRaw: string;
}

export interface AdvancedSearchFilters {
  expMin: string;
  expMax: string;
  cidade: string;
  estado: string;
  raio: 'cidade' | 'estado' | 'nacional' | 'remoto';
  job_titles: string[];
  keywords: string[];
  universidades: string[];
  uniMode: 'incluir' | 'excluir';
  idiomas: Idioma[];
  booleanExpr: string;
  location: string;
  minYears: string;
  maxYears: string;
}

interface AdvancedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  initialFilters?: Partial<FiltersState>;
}

const emptyFilters = (): FiltersState => ({
  expMin: '',
  expMax: '',
  cidade: '',
  estado: '',
  raio: 'estado',
  jobTitles: [],
  somenteCargotAtual: false,
  cargosAnteriores: [],
  keywords: [],
  universidades: [],
  uniMode: 'incluir',
  idiomas: [],
  boolMode: 'visual',
  boolTerms: [{ valor: '', operador: 'AND' }],
  boolRaw: '',
});

function ChipInput({ chips, onAdd, onRemove, placeholder }: { chips: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg min-h-[42px] bg-white focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-400">
      {chips.map(chip => (
        <span key={chip} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
          {chip}
          <button onClick={() => onRemove(chip)} className="hover:text-red-500 transition-colors">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={chips.length ? '' : placeholder}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
      />
    </div>
  );
}

export default function AdvancedFiltersDrawer({ isOpen, onClose, onSearch, initialFilters }: AdvancedFiltersDrawerProps) {
  const [f, setF] = useState<FiltersState>({ ...emptyFilters(), ...initialFilters });
  const [uniInput, setUniInput] = useState('');
  const [uniSuggestions, setUniSuggestions] = useState<string[]>([]);
  const [loadingBoolean, setLoadingBoolean] = useState(false);

  const update = (patch: Partial<FiltersState>) => setF(prev => ({ ...prev, ...patch }));

  const addChip = (field: 'jobTitles' | 'keywords' | 'universidades' | 'cargosAnteriores', val: string) => {
    const curr = (f[field] as string[]) || [];
    if (!curr.includes(val)) {
      const next = [...curr, val];
      update({ [field]: next } as Partial<FiltersState>);
    }
  };
  const removeChip = (field: 'jobTitles' | 'keywords' | 'universidades' | 'cargosAnteriores', val: string) => {
    const next = ((f[field] as string[]) || []).filter((v: string) => v !== val);
    update({ [field]: next } as Partial<FiltersState>);
  };

  const addIdioma = () => update({ idiomas: [...f.idiomas, { idioma: 'Inglês', nivel: 'Avançado' }] });
  const removeIdioma = (i: number) => update({ idiomas: f.idiomas.filter((_, idx) => idx !== i) });
  const updateIdioma = (i: number, patch: Partial<Idioma>) => {
    const next = [...f.idiomas];
    next[i] = { ...next[i], ...patch };
    update({ idiomas: next });
  };

  const addBoolTerm = () => update({ boolTerms: [...f.boolTerms, { valor: '', operador: 'AND' }] });
  const updateBoolTerm = (i: number, patch: Partial<BoolTerm>) => {
    const next = [...f.boolTerms];
    next[i] = { ...next[i], ...patch };
    update({ boolTerms: next });
  };
  const removeBoolTerm = (i: number) => update({ boolTerms: f.boolTerms.filter((_, idx) => idx !== i) });

  const getBoolExpression = () => {
    if (f.boolMode === 'avancado') return f.boolRaw;
    return f.boolTerms.filter(t => t.valor.trim()).map((t, i) => i === 0 ? t.valor : `${t.operador} ${t.valor}`).join(' ');
  };

  const handleConvertWithAI = async () => {
    const expr = getBoolExpression();
    if (!expr) return;
    setLoadingBoolean(true);
    try {
      const res = await fetch('/api/nl-to-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: expr, mode: 'bool' })
      });
      const data = await res.json();
      if (data.filtros_sugeridos?.boolean_expression) {
        update({ boolRaw: data.filtros_sugeridos.boolean_expression, boolMode: 'avancado' });
      }
    } finally {
      setLoadingBoolean(false);
    }
  };

  const countActive = () => {
    let c = 0;
    if (f.expMin || f.expMax) c++;
    if (f.cidade || f.estado) c++;
    if (f.jobTitles.length) c++;
    if (f.keywords.length) c++;
    if (f.universidades.length) c++;
    if (f.idiomas.length) c++;
    if (getBoolExpression()) c++;
    return c;
  };

  const handleSearch = () => {
    const boolExpr = getBoolExpression();
    onSearch({
      expMin: f.expMin,
      expMax: f.expMax,
      cidade: f.cidade,
      estado: f.estado,
      raio: f.raio,
      job_titles: f.jobTitles,
      keywords: f.keywords,
      universidades: f.universidades,
      uniMode: f.uniMode,
      idiomas: f.idiomas,
      booleanExpr: boolExpr,
      location: f.cidade ? `${f.cidade}${f.estado ? ', ' + f.estado : ''}` : f.estado,
      minYears: f.expMin,
      maxYears: f.expMax,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-[360px] h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white z-10">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Filtros Avançados</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{countActive()} filtros ativos</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setF(emptyFilters())} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">
              Limpar tudo
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Filtro 1: Experiência */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-500" /> Experiência Profissional
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input type="number" value={f.expMin} onChange={e => update({ expMin: e.target.value })} placeholder="Mín" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <span className="text-gray-400 text-sm">—</span>
              <div className="flex-1">
                <input type="number" value={f.expMax} onChange={e => update({ expMax: e.target.value })} placeholder="Máx" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">anos</span>
            </div>
          </div>

          {/* Filtro 2: Localização */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-2">
              <Globe className="w-4 h-4 text-indigo-500" /> Localização
            </label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={f.cidade} onChange={e => update({ cidade: e.target.value })} placeholder="Cidade" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              <select value={f.estado} onChange={e => update({ estado: e.target.value })} className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">UF</option>
                {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['cidade', 'estado', 'nacional', 'remoto'] as const).map(opt => (
                <button key={opt} onClick={() => update({ raio: opt })} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${f.raio === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                  {opt === 'cidade' ? 'Apenas esta cidade' : opt === 'estado' ? 'Estado inteiro' : opt === 'nacional' ? 'Nacional' : 'Remoto aceito'}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro 3: Cargo */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-500" /> Cargo
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">Cargo atual — Enter para adicionar</p>
            <ChipInput chips={f.jobTitles} onAdd={v => addChip('jobTitles', v)} onRemove={v => removeChip('jobTitles', v)} placeholder="Ex: Designer de Email" />
          </div>

          {/* Filtro 4: Keywords */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-1.5">
              <Search className="w-4 h-4 text-indigo-500" /> Palavras-chave no perfil
            </label>
            <ChipInput chips={f.keywords} onAdd={v => addChip('keywords', v)} onRemove={v => removeChip('keywords', v)} placeholder="Ex: Figma, CRM — Enter para adicionar" />
            <p className="text-[11px] text-gray-400 mt-1">O perfil deve mencionar estas palavras</p>
          </div>

          {/* Filtro 5: Universidades */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" /> Formação Acadêmica
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="text" value={uniInput}
                  onChange={e => {
                    setUniInput(e.target.value);
                    setUniSuggestions(UNIVERSIDADES_BR.filter(u => u.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && uniInput.trim()) {
                      addChip('universidades', uniInput.trim());
                      setUniInput('');
                      setUniSuggestions([]);
                    }
                  }}
                  placeholder="Digite uma universidade..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {uniSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                    {uniSuggestions.map(u => (
                      <button key={u} onClick={() => { addChip('universidades', u); setUniInput(''); setUniSuggestions([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 text-gray-700">
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {f.universidades.length > 0 && (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {f.universidades.map(u => (
                    <span key={u} className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {u}
                      <button onClick={() => removeChip('universidades', u)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['incluir', 'excluir'] as const).map(m => (
                    <button key={m} onClick={() => update({ uniMode: m })} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${f.uniMode === m ? (m === 'incluir' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-200') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {m === 'incluir' ? 'Incluir apenas estas' : 'Excluir estas'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtro 6: Idiomas */}
          <div>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 mb-2">
              <Languages className="w-4 h-4 text-indigo-500" /> Idiomas
            </label>
            {f.idiomas.map((id, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select value={id.idioma} onChange={e => updateIdioma(i, { idioma: e.target.value })} className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                  {IDIOMAS_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={id.nivel} onChange={e => updateIdioma(i, { nivel: e.target.value })} className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                  {NIVEL_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
                <button onClick={() => removeIdioma(i)} className="text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={addIdioma} className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar idioma
            </button>
          </div>

          {/* Filtro 7: Expressão Booleana */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-gray-800">Expressão Booleana</label>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => update({ boolMode: 'visual' })} className={`px-2.5 py-1 text-xs font-medium transition-colors ${f.boolMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Visual</button>
                <button onClick={() => update({ boolMode: 'avancado' })} className={`px-2.5 py-1 text-xs font-medium transition-colors ${f.boolMode === 'avancado' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Avançado</button>
              </div>
            </div>

            {f.boolMode === 'visual' ? (
              <div className="space-y-2">
                {f.boolTerms.map((term, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    {i > 0 && (
                      <select value={term.operador} onChange={e => updateBoolTerm(i, { operador: e.target.value as BoolTerm['operador'] })} className="w-16 px-1 py-1.5 border border-gray-200 rounded text-xs bg-white font-medium text-indigo-600">
                        <option>AND</option>
                        <option>OR</option>
                        <option>NOT</option>
                      </select>
                    )}
                    <input value={term.valor} onChange={e => updateBoolTerm(i, { valor: e.target.value })} placeholder={i === 0 ? 'Ex: Figma' : 'Termo...'} className={`px-3 py-1.5 border border-gray-200 rounded-lg text-sm flex-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${i === 0 ? 'w-full' : ''}`} />
                    {i > 0 && <button onClick={() => removeBoolTerm(i)} className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
                <button onClick={addBoolTerm} className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Adicionar termo
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={f.boolRaw}
                  onChange={e => update({ boolRaw: e.target.value })}
                  rows={3}
                  placeholder={`Figma AND ("email marketing" OR "email mkt") AND (CRM OR HubSpot)`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">Use AND, OR, NOT e aspas para frases exatas</p>
              </div>
            )}
            <button onClick={handleConvertWithAI} disabled={loadingBoolean} className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors disabled:opacity-50">
              <Sparkles className="w-3.5 h-3.5" />
              {loadingBoolean ? 'Convertendo...' : 'Converter com IA →'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <button onClick={handleSearch} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-[15px]">
            <Search className="w-4 h-4" />
            Buscar Candidatos
          </button>
        </div>
      </div>
    </div>
  );
}
