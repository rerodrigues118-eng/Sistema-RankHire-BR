"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, UploadCloud, CheckCircle2, ArrowRight, Loader2, Sparkles, Building2, User } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!jobTitle.trim()) {
        setError("Informe o titulo da vaga para continuar.");
        return;
      }
      setIsLoading(true);
      
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "job",
            jobTitle,
            area: "Tecnologia",
            contract: "CLT",
            location: "Remoto",
            briefing: `Vaga criada no onboarding para ${jobTitle}`,
          }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Nao foi possivel criar a vaga inicial. Tente novamente em instantes.");
        }
        
        if (data.vaga?.id) {
          try { localStorage.setItem('rankhire_vaga_selecionada', data.vaga.id); } catch { /* ignore */ }
        }
        setStep(3);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 3) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="landing-dark min-h-screen flex items-center justify-center bg-[#030307] relative overflow-hidden px-4 select-none">
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      <div className="bg-zinc-900/60 border border-white/10 backdrop-blur-md p-8 md:p-10 w-full max-w-lg rounded-3xl shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#2563EB] to-[#D4AF37] flex items-center justify-center rounded-full mb-3 shadow-lg">
              <span className="text-white font-extrabold text-xl">R</span>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2 w-full max-w-[200px]">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-1.5 flex-1 rounded-full ${step >= item ? "bg-[#2563EB]" : "bg-white/5"}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-500/10 text-xs font-semibold text-red-400 rounded-lg border border-red-500/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleNext}>
          
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto w-20 h-20 bg-[#2563EB]/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-[#D4AF37]" />
              </div>
              
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Bem-vindo ao RankHire!
              </h1>
              
              <p className="text-[15px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Sua conta foi criada com sucesso. Estamos muito felizes em ter voce a bordo para transformar seu processo de recrutamento.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-zinc-200">E-mail verificado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-zinc-200">Conta configurada</span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  Vamos começar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#2563EB] flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Primeira Vaga</h2>
                  <p className="text-[13px] text-zinc-400 mt-1">Crie sua primeira vaga para testar a IA.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-zinc-400">Qual cargo voce quer preencher?</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all text-[15px]"
                  placeholder="Ex: Desenvolvedor Senior, Vendedor..."
                  autoFocus
                />
              </div>

              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A nossa inteligencia artificial vai usar esse titulo para sugerir criterios de avaliacao e montar o ranking dos candidatos automaticamente.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Vaga <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Tudo pronto!
              </h2>
              
              <p className="text-[15px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
                A vaga <strong className="text-white">{jobTitle}</strong> foi criada. Agora voce ja pode fazer o upload dos curriculos em PDF para ver a magica acontecer.
              </p>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all border border-white/5"
                >
                  Ir para o Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
