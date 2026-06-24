"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Users, Clock, UserMinus, FileText, Search, AlertCircle, ArrowUpRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type AdminOverviewResponse = {
  metrics: {
    mrr: number;
    totalClientes: number;
    clientesAtivos: number;
    trials: number;
    clientesSuspensos: number;
    vagasCriadas: number;
  };
  recentLogs: Array<{
    id: string;
    acao: string;
    created_at: string;
  }>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      if (res.ok) {
        setData(json as AdminOverviewResponse);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto text-sm text-slate-500">Carregando métricas do painel...</div>;
  }

  const metrics = data?.metrics || {
    mrr: 0,
    totalClientes: 0,
    clientesAtivos: 0,
    trials: 0,
    clientesSuspensos: 0,
    vagasCriadas: 0,
  };

  const chartData = [
    { name: "Hoje", total: metrics.totalClientes, trials: metrics.trials, pagantes: metrics.clientesAtivos },
    { name: "Meta", total: metrics.totalClientes + 4, trials: metrics.trials + 2, pagantes: metrics.clientesAtivos + 1 },
  ];

  const recentActivity = (data?.recentLogs || []).map((log, index) => ({
    id: log.id,
    type: index % 3 === 0 ? "upgrade" : index % 3 === 1 ? "novo" : "cancelamento",
    empresa: `Empresa ${index + 1}`,
    detalhe: log.acao,
    data: new Date(log.created_at).toLocaleString("pt-BR"),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">Visão Geral</h2>
          <p className="text-[#6B7280] text-[14px] mt-1">Métricas de saúde do sistema e assinaturas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[#6B7280] text-[13px] font-semibold tracking-wide uppercase">Receita Recorrente (MRR)</h3>
            <div className="w-8 h-8 rounded bg-[#F5C000]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-[28px] font-bold text-[#111827]">
              R$ {(metrics.mrr / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[#6B7280] text-[13px] font-semibold tracking-wide uppercase">Clientes Pagantes</h3>
            <div className="w-8 h-8 rounded bg-[#06D6A0]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#06D6A0]" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-[28px] font-bold text-[#111827]">{metrics.clientesAtivos}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[#6B7280] text-[13px] font-semibold tracking-wide uppercase">Empresas em Trial</h3>
            <div className="w-8 h-8 rounded bg-[#00B4D8]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#00B4D8]" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-[28px] font-bold text-[#111827]">{metrics.trials}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[#6B7280] text-[13px] font-semibold tracking-wide uppercase">Cancelamentos</h3>
            <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
              <UserMinus className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-[28px] font-bold text-[#111827]">{metrics.clientesSuspensos}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#4B5563]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium text-[#6B7280]">Vagas Criadas</span>
              <span className="text-[14px] font-bold text-[#111827]">{metrics.vagasCriadas}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-[#4B5563]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium text-[#6B7280]">Buscas LinkedIn</span>
              <span className="text-[14px] font-bold text-[#111827]">Real time</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium text-[#6B7280]">Erros de API</span>
              <div className="px-2 py-0.5 rounded text-[12px] font-bold bg-red-100 text-red-600">ver logs</div>
            </div>
            <Link href="/sys-control/logs" className="text-[12px] text-[#2563EB] hover:underline font-medium mt-1 inline-block">
              Abrir logs
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
          <h3 className="text-[16px] font-bold text-[#111827] mb-6">Crescimento da Base</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Empresas" stroke="#D1D5DB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="trials" name="Em Trial" stroke="#00B4D8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pagantes" name="Pagantes" stroke="#06D6A0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#111827]">Atividade Recente</h3>
            <Link href="/sys-control/logs" className="text-[13px] text-[#2563EB] hover:underline font-medium">
              Ver tudo
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {recentActivity.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Sem eventos recentes.</div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="p-3 hover:bg-[#F9FAFB] rounded-lg transition-colors flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      act.type === "upgrade"
                        ? "bg-[#06D6A0]/10 text-[#059669]"
                        : act.type === "novo"
                          ? "bg-[#00B4D8]/10 text-[#0284C7]"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {act.type === "upgrade" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : act.type === "novo" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <UserMinus className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">{act.empresa}</p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">{act.detalhe}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5">{act.data}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
