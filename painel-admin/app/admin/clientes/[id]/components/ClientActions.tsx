"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Empresa = {
  id: string;
  notas_internas?: string | null;
  plano?: string | null;
  status?: string | null;
  subscription_status?: string | null;
  mrr_centavos?: number | string | null;
  trial_expires_at?: string | null;
  nome?: string | null;
  cnpj?: string | null;
  segmento?: string | null;
  tamanho?: string | null;
  admin_email?: string | null;
};

const PLAN_OPTIONS = [
  { value: "trial_starter", label: "Trial Starter" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

export default function ClientActions({ empresa }: { empresa: Empresa }) {
  const [notes, setNotes] = useState(empresa.notas_internas || "");
  const [plan, setPlan] = useState(empresa.plano || "trial_starter");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(empresa.nome || "");
  const [cnpj, setCnpj] = useState(empresa.cnpj || "");
  const [segmento, setSegmento] = useState(empresa.segmento || "");
  const [tamanho, setTamanho] = useState(empresa.tamanho || "");
  const [adminEmail, setAdminEmail] = useState(empresa.admin_email || "");
  const [mrr, setMrr] = useState((empresa.mrr_centavos ? Number(empresa.mrr_centavos) : 0) / 100);
  const [trialAt, setTrialAt] = useState(empresa.trial_expires_at ? new Date(empresa.trial_expires_at).toISOString().slice(0,10) : "");
  const router = useRouter();

  async function updateEmpresa(payload: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);

    const response = await fetch(`/api/admin/clientes/${empresa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!response.ok) {
      const result = await response.json();
      setMessage(result?.error || "Erro ao atualizar cliente.");
      return;
    }

    router.refresh();
    setMessage("Atualização realizada com sucesso.");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 24, marginBottom: 24 }}>
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24 }}>
        <h2>Status do cliente</h2>
        <p style={{ color: "#8b949e" }}>Status atual: <strong>{empresa.status || "—"}</strong></p>
        <p style={{ color: "#8b949e" }}>Plano atual: <strong>{empresa.plano || "—"}</strong></p>
        <p style={{ color: "#8b949e" }}>Status assinatura: <strong>{empresa.subscription_status || "—"}</strong></p>
        <p style={{ color: "#8b949e" }}>MRR: <strong>R$ {(empresa.mrr_centavos ? Number(empresa.mrr_centavos) / 100 : 0).toLocaleString()}</strong></p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {empresa.status !== "suspenso" ? (
            <button
              disabled={saving}
              onClick={() => updateEmpresa({ status: "suspenso", motivo_suspensao: "Suspensão administrativa pelo painel." })}
              style={{ background: "#f85149", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              Suspender cliente
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={() => updateEmpresa({ status: "ativo", motivo_suspensao: null })}
              style={{ background: "#238636", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              Reativar cliente
            </button>
          )}
          <a
            href={`/api/admin/impersonate?empresaId=${empresa.id}&redirect=/admin/clientes/${empresa.id}`}
            style={{ background: "#0969da", color: "#fff", padding: "12px 16px", borderRadius: 12, textDecoration: "none" }}
          >
            Impersonar cliente
          </a>
        </div>
      </div>

      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24 }}>
        <h2>Editar configuração rápida</h2>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ color: "#8b949e" }}>Plano</span>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button
          disabled={saving}
          onClick={() => updateEmpresa({ plano: plan })}
          style={{ background: "#238636", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer", width: "100%" }}
        >
          Atualizar plano
        </button>
        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ color: "#8b949e" }}>Notas internas</span>
            <textarea
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 14, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
            />
          </label>
          <button
            disabled={saving}
            onClick={() => updateEmpresa({ notas_internas: notes })}
            style={{ background: "#238636", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, cursor: "pointer", width: "100%" }}
          >
            Salvar notas internas
          </button>
        </div>
        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => setEditing((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: "#0969da", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 10, cursor: "pointer", width: "100%" }}
            aria-label={editing ? 'Fechar edição completa' : 'Editar todos os dados do cliente'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
              <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
            </svg>
            {editing ? "Fechar edição completa" : "Editar todos os dados do cliente"}
          </button>
        </div>
        {editing && (
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Nome da empresa</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>CNPJ</span>
              <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Segmento</span>
              <input value={segmento} onChange={(e) => setSegmento(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Tamanho</span>
              <input value={tamanho} onChange={(e) => setTamanho(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Email administrativo</span>
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>MRR (R$)</span>
              <input type="number" value={mrr} onChange={(e) => setMrr(Number(e.target.value))} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ color: "#8b949e" }}>Trial expira em</span>
              <input type="date" value={trialAt} onChange={(e) => setTrialAt(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }} />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                disabled={saving}
                onClick={() => updateEmpresa({ nome, cnpj, segmento, tamanho, admin_email: adminEmail, mrr_centavos: Math.round(mrr * 100), trial_expires_at: trialAt || null })}
                style={{ background: "#238636", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
              >
                Salvar todos os dados
              </button>
              <button onClick={() => setEditing(false)} style={{ background: "#6c757d", color: "#fff", border: "none", padding: "10px 12px", borderRadius: 10 }}>Cancelar</button>
            </div>
          </div>
        )}
        {message ? <p style={{ marginTop: 16, color: "#adbac7" }}>{message}</p> : null}
      </div>
    </div>
  );
}
