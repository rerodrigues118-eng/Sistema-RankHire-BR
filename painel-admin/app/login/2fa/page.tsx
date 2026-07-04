"use client";

import { useState, useEffect } from "react";

export default function Login2FAPage() {
  const [adminId, setAdminId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setAdminId(params.get("adminId") ?? "");
    } catch (e) {
      // ignore when window isn't available (shouldn't happen in client)
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, token }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Código inválido");
        return;
      }

      window.location.href = "/admin/overview";
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="card">
        <div>
          <p className="status-chip">RankHire BR · Admin</p>
          <h1>Verificação 2FA</h1>
          <p>Insira o código do seu autenticador para acessar o painel.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

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
            {loading ? "Validando..." : "Confirmar"}
          </button>
        </form>
      </section>
    </main>
  );
}
