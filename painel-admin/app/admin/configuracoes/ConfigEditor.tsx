"use client";

import { useMemo, useState } from "react";

export default function ConfigEditor({ configs }: { configs: Array<{ chave: string; valor: string; descricao: string | null }> }) {
  const [values, setValues] = useState<Record<string, string>>(
    configs.reduce((acc, config) => ({ ...acc, [config.chave]: config.valor }), {}),
  );
  const [saving, setSaving] = useState<string | null>(null);

  const entries = useMemo(() => configs, [configs]);

  async function saveConfig(key: string) {
    setSaving(key);
    const response = await fetch("/api/admin/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chave: key, valor: values[key] }),
    });
    setSaving(null);
    if (!response.ok) {
      const body = await response.json();
      alert(body.error || "Falha ao salvar configuração.");
      return;
    }
    alert("Configuração salva com sucesso.");
  }

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
      {entries.map((config) => (
        <div key={config.chave} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, color: "#8b949e" }}>{config.descricao || config.chave}</p>
              <p style={{ margin: "8px 0 0", fontSize: 18 }}>{config.chave}</p>
            </div>
            <button
              disabled={saving === config.chave}
              onClick={() => saveConfig(config.chave)}
              style={{ background: "#238636", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, cursor: "pointer" }}
            >
              {saving === config.chave ? "Salvando..." : "Salvar"}
            </button>
          </div>
          <textarea
            value={values[config.chave] ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, [config.chave]: event.target.value }))}
            rows={3}
            style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 14, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
          />
        </div>
      ))}
    </div>
  );
}
