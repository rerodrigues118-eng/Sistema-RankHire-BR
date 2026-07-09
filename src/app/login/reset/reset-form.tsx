"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ResetForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/login?reset=1`,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || "Não foi possível enviar o e-mail de recuperação.");
      return;
    }

    setMessage(
      "E-mail de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha."
    );
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/5 bg-[#030307]/95 p-8 shadow-2xl shadow-black/20">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Recuperar senha</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Informe seu e-mail para receber o código ou link de redefinição enviado pelo Supabase.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-zinc-300">
            E-mail corporativo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            placeholder="voce@empresa.com.br"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Enviar e-mail de recuperação"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-semibold text-white hover:text-blue-300">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
