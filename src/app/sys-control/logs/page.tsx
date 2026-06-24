"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Calendar, Download, Eye, TerminalSquare } from "lucide-react";

type AdminLog = {
  id: string;
  admin_id: string | null;
  empresa_id: string | null;
  acao: string;
  detalhes: Record<string, unknown> | null;
  created_at: string;
};

export default function AdminLogsPage() {
  const [busca, setBusca] = useState("");
  const [tipoAcao, setTipoAcao] = useState("Todos");
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/logs?limit=25");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const logsFiltrados = logs.filter((log) => {
    const matchBusca = log.acao.toLowerCase().includes(busca.toLowerCase()) || (log.empresa_id || "").toLowerCase().includes(busca.toLowerCase());
    const matchAcao = tipoAcao === "Todos" || log.acao === tipoAcao;
    return matchBusca && matchAcao;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">Logs do Sistema</h2>
          <p className="text-[#6B7280] text-[14px] mt-1">Histórico completo de auditoria das ações administrativas.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-[13px] font-semibold transition-colors shadow-sm w-fit">
          <Download className="w-4 h-4" />
          Exportar Auditoria (.csv)
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#111827] focus:outline-none focus:border-[#06D6A0] focus:ring-1 focus:ring-[#06D6A0] transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <select
              value={tipoAcao}
              onChange={(e) => setTipoAcao(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#374151] font-medium outline-none"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="plano_alterado">Alteração de Plano</option>
              <option value="trial_estendido">Trial Estendido</option>
              <option value="conta_suspensa">Conta Suspensa</option>
              <option value="dados_editados">Dados Editados</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6B7280]" />
            <input type="date" className="px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[13px] text-[#374151] font-medium outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider w-40">Data / Hora</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Admin</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Empresa Alvo</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Ação</th>
              <th className="px-6 py-4 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280] text-[14px]">
                  Carregando logs...
                </td>
              </tr>
            ) : logsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280] text-[14px]">
                  Nenhum log encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              logsFiltrados.map((log) => (
                <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-[#6B7280] font-mono">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] font-medium text-[#111827]">{log.admin_id || "sistema"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-[#374151] font-medium">{log.empresa_id || "-"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#4B5563] border border-[#D1D5DB] rounded text-[11px] font-bold font-mono tracking-tight">
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#00B4D8] hover:text-[#0284C7] bg-[#00B4D8]/10 hover:bg-[#00B4D8]/20 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Spec
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-[#6B7280]" /> Inspetor de Log
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-[#6B7280] hover:text-[#111827] text-[24px] leading-none">
                &times;
              </button>
            </div>

            <div className="p-6 bg-[#FAFAFA] space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <span className="font-semibold text-[#374151]">Ação:</span>{" "}
                  <span className="font-mono bg-white px-2 py-0.5 rounded border">{selectedLog.acao}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Data:</span> {new Date(selectedLog.created_at).toLocaleString("pt-BR")}
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Admin:</span> {selectedLog.admin_id || "sistema"}
                </div>
                <div>
                  <span className="font-semibold text-[#374151]">Empresa:</span> {selectedLog.empresa_id || "-"}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[13px] font-semibold text-[#374151] mb-2">Payload (JSON):</p>
                <pre className="w-full bg-[#111827] text-[#A7F3D0] p-4 rounded-lg overflow-x-auto text-[12px] font-mono leading-relaxed shadow-inner">
{JSON.stringify(
  {
    log_id: selectedLog.id,
    timestamp: selectedLog.created_at,
    actor_id: selectedLog.admin_id,
    target_company_id: selectedLog.empresa_id,
    action: selectedLog.acao,
    metadata: selectedLog.detalhes,
  },
  null,
  2
)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] flex justify-end bg-white">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] rounded-lg text-[13px] font-bold transition-colors"
              >
                Fechar Inspetor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
