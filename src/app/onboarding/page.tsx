"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, UploadCloud, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

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
      if (!jobTitle.trim()) {
        setError("Informe o título da vaga para continuar.");
        return;
      }
      setStep(2);
      return;
    }

    setIsLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
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
      setError(data.error || "Não foi possível criar a vaga inicial.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--color-rh-bg)] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--color-rh-cyan)] opacity-10 blur-[150px] pointer-events-none" />

      {/* Header simples */}
      <header className="h-16 flex items-center px-8 border-b border-[var(--color-rh-bg-border)] relative z-10">
        <div className="w-8 h-8 rounded-[6px] bg-logo-gradient flex items-center justify-center mr-3">
          <span className="text-[var(--color-rh-bg)] font-bold text-sm">R</span>
        </div>
        <span className="text-white font-bold tracking-tight">RankHire BR</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-3">
              Bem-vindo ao futuro do recrutamento! 🚀
            </h1>
            <p className="text-[var(--color-rh-gray)] text-[15px]">
              Vamos configurar sua primeira vaga em menos de 1 minuto para testar nossa IA.
            </p>
          </div>

          <div className="card-rh p-8 md:p-10 shadow-2xl relative">
            <form onSubmit={handleNext}>
              
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b border-[var(--color-rh-bg-border)] pb-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-rh-cyan)]/10 text-[var(--color-rh-cyan)] flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Qual vaga você quer preencher?</h2>
                      <p className="text-[13px] text-[var(--color-rh-gray)] mt-1">Nossa IA criará os critérios automaticamente.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-medium text-[var(--color-rh-gray)]">Título da Vaga</label>
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--color-rh-bg)] border border-[var(--color-rh-bg-border)] rounded-lg text-white focus:outline-none focus:border-[var(--color-rh-cyan)] focus:ring-1 focus:ring-[var(--color-rh-cyan)] transition-all text-[15px]"
                      placeholder="Ex: Desenvolvedor React Sênior, Gerente de Vendas..."
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b border-[var(--color-rh-bg-border)] pb-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-rh-secondary)]/10 text-[var(--color-rh-secondary)] flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Faça o upload do seu primeiro CV</h2>
                      <p className="text-[13px] text-[var(--color-rh-gray)] mt-1">
                        Suba um currículo para a vaga de <strong className="text-white">{jobTitle}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-[var(--color-rh-bg-border)] rounded-xl p-10 text-center hover:border-[var(--color-rh-cyan)] transition-colors cursor-pointer bg-[rgba(255,255,255,0.01)] group">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-rh-bg)] mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-[var(--color-rh-gray)] group-hover:text-[var(--color-rh-cyan)] transition-colors" />
                    </div>
                    <h3 className="text-[16px] font-bold text-white mb-2">Arraste um PDF ou clique aqui</h3>
                    <p className="text-[13px] text-[var(--color-rh-gray)]">A IA extrairá as habilidades e pontuará o candidato imediatamente.</p>
                  </div>
                </div>
              )}

              <div className="pt-8 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 1 ? 'bg-[var(--color-rh-cyan)]' : 'bg-[var(--color-rh-bg-border)]'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 2 ? 'bg-[var(--color-rh-cyan)]' : 'bg-[var(--color-rh-bg-border)]'}`} />
                </div>
                
                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-logo-gradient hover:brightness-110 disabled:opacity-60 text-[var(--color-rh-bg)] rounded-lg text-[15px] font-bold transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-rh-cyan)]/20"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step === 1 ? (
                    <>Continuar <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Ir para o Dashboard <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
