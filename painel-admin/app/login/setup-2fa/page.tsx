"use client";

import { useEffect, useState } from "react";

type SetupResponse = {
  email: string;
  otpauth: string;
  secret: string;
};

export default function Setup2FAPage() {
  const [adminId, setAdminId] = useState("");
  const [data, setData] = useState<SetupResponse | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("adminId") || "";
      setAdminId(id);
    } catch (e) {
      setAdminId("");
    }
  }, []);

  useEffect(() => {
    async function loadSetup() {
      if (!adminId) {
        setError("ID do administrador ausente.");
        return;
      }

      const response = await fetch(`/api/auth/setup-2fa?adminId=${encodeURIComponent(adminId)}`);
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error || "Falha ao iniciar configuração 2FA.");
        return;
      }
      setData(body);
    }

    loadSetup();
  }, [adminId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminId) {
      setError("ID do administrador ausente.");
      return;
    }

    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/setup-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, token }),
    });
    const body = await response.json();

    setLoading(false);
    if (!response.ok) {
      setError(body?.error || "Código inválido.");
      return;
    }

    setSuccess(true);
    window.location.href = "/admin/overview";
  }

  return (
    <main className="page-shell">
      <section className="card">
        <p className="status-chip">RankHire BR · Admin</p>
        <h1>Configurar autenticação de dois fatores</h1>
        <p>Escaneie o QR code no seu app de autenticação ou use a chave em texto.</p>

        {error ? <div className="alert">{error}</div> : null}

        {data ? (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: 18, borderRadius: 16 }}>
              <p style={{ marginBottom: 12, color: "#8b949e" }}>Email do admin</p>
              <p>{data.email}</p>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ background: "#010409", padding: 22, borderRadius: 18, textAlign: "center" }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.otpauth)}`} alt="QR code 2FA" />
              </div>

              <div style={{ background: "#010409", padding: 18, borderRadius: 18, border: "1px solid #30363d" }}>
                <p style={{ color: "#8b949e", marginBottom: 8 }}>Chave secreta</p>
                <code style={{ display: "block", wordBreak: "break-all", color: "#e6edf3" }}>{data.secret}</code>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="token">Código do autenticador</label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <button type="submit" className="button" disabled={loading}>
                {loading ? "Confirmando..." : "Confirmar 2FA"}
              </button>
            </form>
          </div>
        ) : (
          <p className="footer-text">Carregando configuração 2FA...</p>
        )}

        {success ? <p className="footer-text">2FA configurado com sucesso! Redirecionando...</p> : null}
      </section>
    </main>
  );
}
