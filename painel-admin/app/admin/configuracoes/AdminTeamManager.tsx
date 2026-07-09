"use client";

import { useState } from "react";
import styles from "./admin-team-manager.module.css";

const ADMIN_ROLES = ["readonly", "suporte", "financeiro", "administrador", "superadmin"];

export default function AdminTeamManager({ initialAdmins }: { initialAdmins: Array<AdminUser> }) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("readonly");

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

  async function createAdmin() {
    if (!newEmail || !newPassword) {
      alert("Email e senha são obrigatórios.");
      return;
    }

    setCreating(true);
    const response = await fetch("/api/admin/admin-usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newName, email: newEmail, senha: newPassword, role: newRole }),
    });
    setCreating(false);

    if (!response.ok) {
      const body = await response.json();
      alert(body.error || "Falha ao criar o administrador.");
      return;
    }

    const created = await response.json();
    setAdmins((prev) => [...prev, created.admin]);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("readonly");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Equipe de administração</h2>
          <p style={{ color: "#8b949e", margin: "8px 0 0" }}>Crie e gerencie os administradores do painel.</p>
        </div>
      </div>

      <div className={styles.formRow}>
        <input
          className={`${styles.input}`}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nome"
        />
        <input
          className={`${styles.input}`}
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          className={`${styles.input}`}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Senha"
          type="password"
        />
        <select className={styles.select} value={newRole} onChange={(event) => setNewRole(event.target.value)}>
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button className={styles.button} onClick={createAdmin} disabled={creating}>
          {creating ? "Criando..." : "Criar administrador"}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>Nome</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Ativo</th>
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className={styles.tr}>
                <td className={styles.td}>{admin.nome || "—"}</td>
                <td className={styles.td}>{admin.email || "—"}</td>
                <td className={styles.td}>
                  <select
                    value={admin.role}
                    onChange={(event) => updateAdmin(admin.id, { role: event.target.value })}
                    disabled={savingId === admin.id}
                    className={styles.select}
                  >
                    {ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={styles.td}>
                  <button
                    disabled={savingId === admin.id}
                    onClick={() => updateAdmin(admin.id, { ativo: !admin.ativo })}
                    className={styles.actionButton}
                    style={{ background: admin.ativo ? "#238636" : "#8b949e", color: "#fff" }}
                  >
                    {admin.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className={styles.td}>
                  <span className={styles.statusTag}>{savingId === admin.id ? "Atualizando..." : "Pronto"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
