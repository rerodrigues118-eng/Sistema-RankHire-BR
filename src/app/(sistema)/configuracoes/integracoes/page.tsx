"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Video,
  Download,
  Mail,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface IntegrationsConfig {
  google_calendar_connected: boolean;
  auto_generate_meet: boolean;
  sync_events: boolean;
  weekly_email_backup: boolean;
  export_format: string;
}

export default function IntegracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [config, setConfig] = useState<IntegrationsConfig>({
    google_calendar_connected: false,
    auto_generate_meet: true,
    sync_events: true,
    weekly_email_backup: false,
    export_format: "csv",
  });

  const [exportScope, setExportScope] = useState<string>("geral");
  const [vagas, setVagas] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [configRes, vagasRes] = await Promise.all([
          fetch("/api/integrations/config"),
          fetch("/api/vagas"),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.config) {
            setConfig(configData.config);
          }
        }

        if (vagasRes.ok) {
          const vagasData = await vagasRes.json();
          if (Array.isArray(vagasData.vagas)) {
            setVagas(vagasData.vagas);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar integrações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggle = async (key: keyof IntegrationsConfig) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    setSaving(true);

    try {
      const res = await fetch("/api/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Erro ao salvar configuração.");
      setFeedback({ type: "success", text: "Configuração atualizada com sucesso!" });
    } catch {
      setFeedback({ type: "error", text: "Falha ao salvar alteração." });
    } finally {
      setSaving(false);
    }
  };

  const handleFormatChange = async (format: string) => {
    const updated = { ...config, export_format: format };
    setConfig(updated);
    try {
      await fetch("/api/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  const handleConnectGoogle = () => {
    const redirectUri = `${window.location.origin}/api/integrations/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=MOCK_CLIENT_ID&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=https://www.googleapis.com/auth/calendar&access_type=offline&prompt=consent`;
    
    // Process connection
    window.location.href = redirectUri + "?code=simulated_auth_code";
  };

  const handleDownloadExport = async () => {
    setDownloading(true);
    setFeedback(null);
    try {
      const url = `/api/export/candidates?format=${config.export_format}&vaga_id=${exportScope}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao gerar download da planilha.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `exportacao_candidatos_${new Date().toISOString().slice(0, 10)}.${config.export_format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setFeedback({ type: "success", text: "Planilha baixada com sucesso!" });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao exportar dados." });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Integrações</h1>
            <p className="mt-1 text-sm text-slate-500">
              Conecte ferramentas externas e gerencie a exportação automática de dados de recrutamento.
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Grid de Cards Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Google Calendar & Meet */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Google Calendar & Meet</h2>
                    <span className="text-xs text-slate-500">Agendamento autônomo de entrevistas</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    config.google_calendar_connected
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {config.google_calendar_connected ? "Conectado" : "Desconectado"}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Sincronize sua agenda de recrutamento para criar reuniões automaticamente ao avançar candidatos no pipeline.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Gerar link do Google Meet automaticamente</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.auto_generate_meet}
                    onClick={() => handleToggle("auto_generate_meet")}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      config.auto_generate_meet ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        config.auto_generate_meet ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Sincronizar eventos de entrevistas</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.sync_events}
                    onClick={() => handleToggle("sync_events")}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      config.sync_events ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        config.sync_events ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {config.google_calendar_connected ? "Reconectar Google Account" : "Conectar Google Calendar & Meet"}
              </button>
            </div>
          </div>

          {/* Card 2: Exportação de Dados (Pipeline & CRM) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Exportação de Dados (Pipeline & CRM)</h2>
                  <span className="text-xs text-slate-500">Download em lote de relatórios</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Formato do Arquivo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFormatChange("csv")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                        config.export_format === "csv"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      CSV (Excel Universal)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange("xlsx")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                        config.export_format === "xlsx"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Planilha (.XLSX)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Escopo de Exportação</label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="geral">CRM Geral (Todos os Candidatos)</option>
                    {vagas.map((vaga) => (
                      <option key={vaga.id} value={vaga.id}>
                        Vaga: {vaga.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Backup Semanal por E-mail</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.weekly_email_backup}
                    onClick={() => handleToggle("weekly_email_backup")}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      config.weekly_email_backup ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        config.weekly_email_backup ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadExport}
                disabled={downloading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Baixar Planilha de Candidatos
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
