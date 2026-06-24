"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, Download, Building2 } from "lucide-react";

type Cliente = {
  id: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  admin_email: string | null;
  plano: string;
  status: string;
  trial_expires_at: string | null;
  created_at: string;
  mrr_centavos: number;
};

type ClientesResponse = {
  clientes: Cliente[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
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

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState<ClientesResponse["pagination"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPlano, setFiltroPlano] = useState("Todos");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function carregarClientes() {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (busca.trim()) params.set("q", busca.trim());

      const res = await fetch(`/api/admin/clientes?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        const data = json as ClientesResponse;
        setClientes(data.clientes || []);
        setPagination(data.pagination);
      }
      setIsLoading(false);
    }

    carregarClientes();
  }, [page, busca]);

  const clientesFiltrados = clientes.filter((cliente) => {
    const matchStatus = filtroStatus === "Todos" || normalizeStatus(cliente.status) === filtroStatus.toLowerCase();
    const matchPlano = filtroPlano === "Todos" || normalizePlan(cliente.plano) === filtroPlano.toLowerCase().replace(" ", "_");
    return matchStatus && matchPlano;
  });

  const totalPages = pagination?.total_pages || 1;

  const getPlanoBadge = (plano: string) => {
    switch (normalizePlan(plano)) {
      case "trial_starter":
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[11px] font-semibold uppercase">Trial</span>;
      case "starter":
        return <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-semibold uppercase">Starter</span>;
      case "pro":
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold uppercase">Pro</span>;
      case "agencia":
        return <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold uppercase">Agência</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[11px] font-semibold uppercase">{normalizeText(plano, "N/D")}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (normalizeStatus(status)) {
      case "ativo":
        return <span className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Ativo</span>;
      case "suspenso":
        return <span className="flex items-center gap-1.5 text-red-600 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />Suspenso</span>;
      case "cancelado":
        return <span className="flex items-center gap-1.5 text-gray-500 text-[12px] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" />Cancelado</span>;
      default:
        return <span>{normalizeText(status, "N/D")}</span>;
    }
  };

  const getDiasRestantes = (dataVencimento: string | null) => {
    if (!dataVencimento) return null;
    const diff = new Date(dataVencimento).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">Clientes</h2>
          <p className="text-[#6B7280] text-[14px] mt-1">Gerencie as empresas e assinaturas da plataforma.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[13px] font-semibold transition-colors shadow-sm w-fit">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => {
              setPage(1);
              setBusca(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#111827] focus:outline-none focus:border-[#06D6A0] focus:ring-1 focus:ring-[#06D6A0] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#374151] font-medium outline-none"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Suspenso">Suspensos</option>
              <option value="Cancelado">Cancelados</option>
            </select>
          </div>

          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#374151] font-medium outline-none"
          >
            <option value="Todos">Todos os Planos</option>
            <option value="Trial Starter">Trial</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Agencia">Agência</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Admin</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Trial / Desde</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">MRR</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280] text-[14px]">
                    Carregando clientes...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280] text-[14px]">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const diasTrial = getDiasRestantes(cliente.trial_expires_at);
                  const isTrial = normalizePlan(cliente.plano).includes("trial");

                  return (
                    <tr key={cliente.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-[#9CA3AF]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#111827]">{cliente.nome_fantasia}</p>
                            <p className="text-[12px] text-[#6B7280] mt-0.5">CNPJ: {normalizeText(cliente.cnpj)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] text-[#374151] font-medium">{normalizeText(cliente.admin_email)}</p>
                      </td>
                      <td className="px-6 py-4">{getPlanoBadge(cliente.plano)}</td>
                      <td className="px-6 py-4">{getStatusBadge(cliente.status)}</td>
                      <td className="px-6 py-4">
                        {isTrial && diasTrial !== null ? (
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-bold ${diasTrial < 7 ? "text-red-600" : "text-[#D97706]"}`}>
                              Expira em {diasTrial} dias
                            </span>
                            <span className="text-[11px] text-[#6B7280]">
                              {safeDate(cliente.trial_expires_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[13px] text-[#374151]">Cliente desde</span>
                            <span className="text-[11px] text-[#6B7280]">{safeDate(cliente.created_at)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-semibold text-[#111827]">
                          R$ {(cliente.mrr_centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/sys-control/clientes/${cliente.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#00B4D8] hover:text-[#0284C7] bg-[#00B4D8]/10 hover:bg-[#00B4D8]/20 rounded-lg transition-colors"
                        >
                          Gerenciar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <span className="text-[13px] text-[#6B7280]">
            Mostrando <span className="font-semibold text-[#111827]">{clientesFiltrados.length}</span> de{" "}
            <span className="font-semibold text-[#111827]">{pagination?.total || 0}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-md text-[12px] font-medium text-[#374151] disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-[12px] text-[#6B7280]">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-md text-[12px] font-medium text-[#374151] disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
