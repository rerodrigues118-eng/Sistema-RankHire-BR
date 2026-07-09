"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    
    // Configuração para OAuth Google. O redirecionamento será gerido pelo Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError("Ocorreu um erro ao tentar entrar com Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Botão Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-zinc-800 transition-all mb-6 shadow-sm cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/5"></div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ou com e-mail</span>
        <div className="flex-1 h-px bg-white/5"></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 text-xs font-semibold text-red-400 rounded-lg flex items-center gap-2 border border-red-500/20 leading-normal">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-zinc-400">E-mail corporativo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-zinc-700 shadow-sm"
            placeholder="voce@empresa.com.br"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-zinc-400 flex justify-between">
            <span>Senha</span>
            <Link href="/login/reset" className="text-blue-500 hover:text-blue-400 hover:underline transition-all font-bold">
              Esqueceu?
            </Link>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-zinc-700 shadow-sm"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all flex justify-center items-center shadow-lg shadow-blue-600/10"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na plataforma"}
          </button>
          <div className="text-center mt-2">
            <span className="text-xs text-zinc-500 font-medium">Não tem uma conta? </span>
            <button
              type="button"
              onClick={() => router.push('/cadastro')}
              className="text-xs font-bold text-white hover:text-blue-400 transition-colors"
            >
              Crie agora
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
