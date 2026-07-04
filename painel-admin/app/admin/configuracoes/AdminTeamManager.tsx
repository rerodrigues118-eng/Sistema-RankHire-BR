"use client";

import { useState } from "react";

export default function AdminTeamManager({ initialAdmins }: { initialAdmins: Array<any> }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateAdmin(adminId: string, patch: { ativo?: boolean; role?: string }) {
    setSavingId(adminId);
    const response = await fetch("/api/admin/admin-usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: adminId, ...patch }),
    });
    setSavingId(null);
    if (!response.ok) {
      const body = await response.json();
      alert(body.error || "Falha ao atualizar membro da equipe.");
      return;
    }

    setAdmins((prev) => prev.map((item) => (item.id === adminId ? { ...item, ...patch } : item)));
  }

  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 20, padding: 24, marginTop: 24 }}>
      <h2>Equipe de administração</h2>
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ color: "#8b949e" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>Nome</th>
              <th style={{ textAlign: "left", padding: 12 }}>Email</th>
              <th style={{ textAlign: "left", padding: 12 }}>Role</th>
              <th style={{ textAlign: "left", padding: 12 }}>Ativo</th>
              <th style={{ textAlign: "left", padding: 12 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} style={{ borderTop: "1px solid #23272b" }}>
                <td style={{ padding: 12 }}>{admin.nome || "—"}</td>
                <td style={{ padding: 12 }}>{admin.email || "—"}</td>
                <td style={{ padding: 12 }}>
                  <select
                    value={admin.role}
                    onChange={(event) => updateAdmin(admin.id, { role: event.target.value })}
                    disabled={savingId === admin.id}
                    style={{ width: "100%", padding: 8, borderRadius: 10, background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" }}
                  >
                    <option value="readonly">readonly</option>
                    <option value="suporte">suporte</option>
                    <option value="financeiro">financeiro</option>
                    <option value="administrador">administrador</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </td>
                <td style={{ padding: 12 }}>
                  <button
                    disabled={savingId === admin.id}
                    onClick={() => updateAdmin(admin.id, { ativo: !admin.ativo })}
                    style={{ background: admin.ativo ? "#238636" : "#8b949e", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}
                  >
                    {admin.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ color: "#8b949e", fontSize: 13 }}>{savingId === admin.id ? "Atualizando..." : "Pronto"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
