"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_OPTIONS = [
  { value: "trial_starter", label: "Trial Starter" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

export default function ClientActions({ empresa }: { empresa: any }) {
  const [notes, setNotes] = useState(empresa.notas_internas || "");
  const [plan, setPlan] = useState(empresa.plano || "trial_starter");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
        {message ? <p style={{ marginTop: 16, color: "#adbac7" }}>{message}</p> : null}
      </div>
    </div>
  );
}
