"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";

type Company = {
  id: string;
  nome: string;
  cnpj?: string;
  tamanho?: string;
  segmento?: string;
  plano?: string;
};

export default function CompanySection() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tamanho, setTamanho] = useState("1-10");
  const [segmento, setSegmento] = useState("Tecnologia");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/empresas", { credentials: "include" });
        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          if (data.empresa) {
            setCompany(data.empresa);
            setNomeEmpresa(data.empresa.nome || "");
            setCnpj(data.empresa.cnpj || "");
            setTamanho(data.empresa.tamanho || "1-10");
            setSegmento(data.empresa.segmento || "Tecnologia");
            setIsEditing(false);
          }
        } else if (active) {
          // Erro do servidor — não tentar novamente automaticamente
          const errData = await res.json().catch(() => ({}));
          setFeedback({ type: "error", text: errData.error || "Erro ao carregar dados da empresa." });
        }
      } catch {
        if (active) {
          setFeedback({ type: "error", text: "Erro ao carregar dados da empresa." });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();

    if (!nomeEmpresa.trim()) {
      setFeedback({ type: "error", text: "Nome da empresa é obrigatório." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/empresas", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeEmpresa,
          cnpj: cnpj || null,
          tamanho,
          segmento,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar empresa.");

      setCompany(data.empresa);
      setIsEditing(false);
      setFeedback({ type: "success", text: "Empresa salva com sucesso!" });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar empresa." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #E2E8F0' }}>
        <div className="min-h-[120px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
        </div>
      </div>
    );
  }

  const hasCompany = !!company;

  return (
    <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #E2E8F0' }}>
      <div className="mb-4 flex items-center gap-2">
        <Building2 size={16} style={{ color: '#1B4FD8' }} />
        <h2 className="text-sm font-medium text-gray-800">Empresa</h2>
      </div>

      {hasCompany && !isEditing ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Nome da empresa</label>
            <div className="px-3 py-2.5 rounded-md bg-slate-50 text-slate-700 text-[14px] border border-slate-200">{company?.nome}</div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">CNPJ</label>
            <div className="px-3 py-2.5 rounded-md bg-slate-50 text-slate-700 text-[14px] border border-slate-200">{company?.cnpj || 'Não informado'}</div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Tamanho</label>
            <div className="px-3 py-2.5 rounded-md bg-slate-50 text-slate-700 text-[14px] border border-slate-200">{company?.tamanho || 'Não informado'}</div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Segmento</label>
            <div className="px-3 py-2.5 rounded-md bg-slate-50 text-slate-700 text-[14px] border border-slate-200">{company?.segmento || 'Não informado'}</div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-md bg-[#1B4FD8] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#163fb3]">Editar informações</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Nome da empresa *</label>
              <input type="text" required value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Minha Empresa Ltda." className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent" />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">CNPJ</label>
              <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="Ex: 12.345.678/0001-90" className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent" />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Tamanho da empresa</label>
              <select value={tamanho} onChange={(e) => setTamanho(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent">
                <option value="1-10">1 a 10 pessoas</option>
                <option value="11-50">11 a 50 pessoas</option>
                <option value="51-200">51 a 200 pessoas</option>
                <option value="200+">200+ pessoas</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Segmento/Indústria</label>
              <select value={segmento} onChange={(e) => setSegmento(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent">
                <option value="Tecnologia">Tecnologia</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Varejo">Varejo</option>
                <option value="Manufatura">Manufatura</option>
                <option value="Serviços">Serviços</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#1B4FD8] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#163fb3] disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {hasCompany ? 'Atualizar' : 'Criar empresa'}</button>
          </div>

          {feedback && (
            <div className={`rounded-lg border px-4 py-3 text-[13px] font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{feedback.text}</div>
          )}
        </form>
      )}
    </div>
  );
}
