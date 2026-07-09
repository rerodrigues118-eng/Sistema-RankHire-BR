"use client";

import { useState } from "react";
import styles from "./page.module.css";

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

      setSuccess(true);
      window.location.href = "/admin/overview";
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.grid}>
        <div className={styles.copy}>
          <span className={styles.badge}>RankHire BR · Admin</span>
          <h1>Bem-vindo de volta</h1>
          <p>Faça login com sua conta administrativa para acessar o painel do RankHire.</p>

          <div className={styles.infoPanel}>
            <p>Login seguro com e-mail e senha.</p>
            <p>Mantenha seus acessos atualizados e utilize apenas dispositivos confiáveis.</p>
          </div>
        </div>

        <section className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <p className={styles.title}>Entrar no painel administrativo</p>
            <p className={styles.subtitle}>Acesse sua conta com e-mail e senha.</p>
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">Email corporativo</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@empresa.com.br"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>

          {success ? <p className={styles.footer}>Login realizado. Redirecionando...</p> : null}
        </section>
      </div>
    </main>
  );
}
