"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Falha ao autenticar");
        return;
      }

      if (body.requires2fa) {
        window.location.href = "/login/2fa?adminId=" + encodeURIComponent(body.adminId);
        return;
      }

      if (body.needsSetup) {
        window.location.href = "/login/setup-2fa?adminId=" + encodeURIComponent(body.adminId);
        return;
      }

      setSuccess(true);
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
          <h1>Entrar no painel administrativo</h1>
          <p>Login exclusivo para administradores. Use suas credenciais e 2FA.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        {success ? <p className="footer-text">Login realizado. Redirecionando...</p> : null}
      </section>
    </main>
  );
}
