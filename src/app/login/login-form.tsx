"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginForm({ plan, source, urlError }: { plan?: string; source?: string; urlError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError || null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciais inválidas. Tente novamente.");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message || "Ocorreu um erro ao tentar entrar com Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-left">
      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm mb-6 cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuar com Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
          OU COM E-MAIL
        </span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-xs font-medium text-red-600 rounded-lg flex items-center gap-2 border border-red-200 leading-normal">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">E-mail corporativo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm"
            placeholder="voce@empresa.com.br"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">Senha</label>
            <Link
              href="/login/reset"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Esqueceu?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white font-medium py-2.5 px-4 rounded-lg shadow-md shadow-blue-500/20 hover:opacity-95 transition-all text-sm flex justify-center items-center cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na plataforma"}
          </button>
          
          <div className="text-center mt-3 text-sm text-slate-500 font-normal">
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (plan) params.set("plan", plan);
                if (source) params.set("source", source);
                router.push(`/cadastro${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="text-blue-600 font-medium hover:underline transition-colors cursor-pointer"
            >
              Crie agora
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
