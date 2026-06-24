"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CreditCard, Users, BarChart3, Save, AlertTriangle } from "lucide-react";

type EmpresaDetalhe = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  plano: string | null;
  status: string | null;
  trial_expires_at: string | null;
  mrr_centavos: number | null;
  subscription_status: string | null;
  current_period_end: string | null;
  usuarios?: { id: string; email: string | null; role: string | null; created_at: string | null }[];
};

function normalizeText(value: string | null | undefined, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeRole(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizePlan(value: string | null | undefined) {
  const plan = normalizeRole(value);
  if (!plan) return "trial_starter";
  if (plan === "trial" || plan === "trial starter" || plan === "trial_starter") return "trial_starter";
  if (plan === "basic" || plan === "starter") return "starter";
  if (plan === "pro" || plan === "professional") return "pro";
  if (plan === "agencia" || plan === "agência" || plan === "agency") return "agencia";
  return plan.replace(/\s+/g, "_");
}

function normalizeStatus(value: string | null | undefined) {
  const status = normalizeRole(value);
  if (status === "active" || status === "paid" || status === "pagante") return "ativo";
  if (status === "suspended" || status === "suspenso") return "suspenso";
  if (status === "canceled" || status === "cancelado" || status === "ended") return "cancelado";
  if (status === "trialing") return "trial";
  return status || "trial";
}

function safeDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

export default function AdminGerenciarClientePage() {
  const { empresa_id } = useParams() as { empresa_id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dados");
  const [empresa, setEmpresa] = useState<EmpresaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/clientes/${empresa_id}`);
      const json = await res.json();
      if (res.ok) {
        setEmpresa(json.empresa as EmpresaDetalhe);
      }
      setLoading(false);
    }
    load();
  }, [empresa_id]);

  const handleSuspend = async () => {
    setActionError(null);
    const res = await fetch(`/api/admin/clientes/${empresa_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "suspenso", confirmation }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error || "Não foi possível suspender.");
      return;
    }
    setActionSuccess("Conta suspensa com sucesso.");
    setShowSuspendConfirm(false);
  };

  const handleDelete = async () => {
    setActionError(null);
    const res = await fetch(`/api/admin/clientes/${empresa_id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error || "Não foi possível excluir.");
      return;
    }
    router.push("/sys-control/clientes");
  };

  if (loading) {
    return <div className="p-8 max-w-5xl mx-auto text-sm text-slate-500">Carregando cliente...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-semibold text-[#6B7280] hover:text-[#111827]">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Clientes
      </button>

      <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] border border-[#D1D5DB] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-[#9CA3AF]" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">{normalizeText(empresa?.nome, "Empresa")}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold uppercase">
                {normalizePlan(empresa?.plano)}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {normalizeStatus(empresa?.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-[#6B7280]">Cliente há</p>
          <p className="text-[16px] font-bold text-[#111827]">{safeDate(empresa?.trial_expires_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-[#E5E7EB] px-2 overflow-x-auto">
        <button onClick={() => setActiveTab("dados")} className={`flex items-center gap-2 py-3 px-1 border-b-2 text-[14px] font-semibold ${activeTab === "dados" ? "border-[#06D6A0] text-[#06D6A0]" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}>
          <Building2 className="w-4 h-4" /> Dados da Empresa
        </button>
        <button onClick={() => setActiveTab("plano")} className={`flex items-center gap-2 py-3 px-1 border-b-2 text-[14px] font-semibold ${activeTab === "plano" ? "border-[#06D6A0] text-[#06D6A0]" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}>
          <CreditCard className="w-4 h-4" /> Plano e Cobrança
        </button>
        <button onClick={() => setActiveTab("usuarios")} className={`flex items-center gap-2 py-3 px-1 border-b-2 text-[14px] font-semibold ${activeTab === "usuarios" ? "border-[#06D6A0] text-[#06D6A0]" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}>
          <Users className="w-4 h-4" /> Usuários da Empresa
        </button>
        <button onClick={() => setActiveTab("uso")} className={`flex items-center gap-2 py-3 px-1 border-b-2 text-[14px] font-semibold ${activeTab === "uso" ? "border-[#06D6A0] text-[#06D6A0]" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}>
          <BarChart3 className="w-4 h-4" /> Uso e Métricas
        </button>
      </div>

      {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
      {actionSuccess && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionSuccess}</div>}

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6 space-y-8">
        {activeTab === "dados" && (
          <div className="space-y-6">
            <h3 className="text-[16px] font-bold text-[#111827] mb-4">Informações Cadastrais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Nome da Empresa</label>
                <input type="text" defaultValue={normalizeText(empresa?.nome, "")} className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">CNPJ</label>
                <input type="text" defaultValue={normalizeText(empresa?.cnpj, "")} className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] focus:outline-none focus:border-[#06D6A0]" />
              </div>
            </div>
            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
              <button onClick={() => setShowSuspendConfirm(true)} className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-[13px] rounded-lg">
                Suspender
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] rounded-lg">
                Excluir Permanente
              </button>
              <button className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-white font-bold text-[13px] rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {activeTab === "plano" && (
          <div className="space-y-4">
            <h3 className="text-[16px] font-bold text-[#111827]">Plano Atual</h3>
            <p className="text-sm text-slate-600">Status: {normalizeStatus(empresa?.subscription_status)}</p>
            <p className="text-sm text-slate-600">Renovação: {safeDate(empresa?.current_period_end)}</p>
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <h3 className="text-[16px] font-bold text-[#111827]">Usuários Vinculados</h3>
            <table className="w-full text-left border-collapse border border-[#E5E7EB] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(empresa?.usuarios || []).map((usuario) => (
                  <tr key={usuario.id || `${usuario.email}-${usuario.created_at}`}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#111827]">{normalizeText(usuario.email)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold">{normalizeRole(usuario.role)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "uso" && (
          <div className="space-y-8">
            <h3 className="text-[16px] font-bold text-[#111827]">Métricas de Utilização</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                <p className="text-[12px] font-semibold text-[#6B7280] uppercase">MRR</p>
                <p className="text-[24px] font-bold text-[#111827] mt-1">R$ {(Number(empresa?.mrr_centavos || 0) / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSuspendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Suspender conta</h3>
            <p className="text-sm text-slate-600">Digite <strong>CONFIRMAR</strong> para suspender a empresa.</p>
            <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="CONFIRMAR" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSuspendConfirm(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleSuspend} className="px-4 py-2 rounded-lg bg-red-600 text-white">Suspender</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Excluir permanentemente</h3>
            <p className="text-sm text-slate-600">Digite <strong>EXCLUIR PERMANENTEMENTE</strong> para remover a empresa e todos os dados relacionados.</p>
            <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="EXCLUIR PERMANENTEMENTE" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
