"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Share2, Users, Bot, Calendar, Search, Briefcase, Building2, User, Rocket, Target, Coffee, Loader2 } from "lucide-react";

const ORIGEM_OPTIONS = [
  { value: "redes_sociais", label: "Redes Sociais", icon: "Share2", desc: "Instagram, LinkedIn, TikTok..." },
  { value: "recomendacao", label: "Recomendação de Colega", icon: "Users", desc: "Indicação pessoal ou profissional" },
  { value: "ia_chatgpt", label: "Inteligência Artificial", icon: "Bot", desc: "ChatGPT, Gemini ou similar" },
  { value: "evento", label: "Evento do Setor", icon: "Calendar", desc: "Congresso, meetup ou conferência" },
  { value: "busca_organica", label: "Pesquisa do Google", icon: "Search", desc: "Resultado de busca orgânica" },
  { value: "comunidade", label: "Comunidade de Tech/RH", icon: "Coffee", desc: "Slack, Discord ou grupo online" },
];

const OBJETIVO_OPTIONS = [
  { value: "recrutador_interno", label: "Recrutador Interno", icon: "Briefcase", desc: "Gestão de RH corporativo" },
  { value: "headhunter", label: "Headhunter / Agência", icon: "Target", desc: "Consultoria especializada" },
  { value: "lideranca", label: "Liderança / Gestor", icon: "Users", desc: "Gestor de equipe" },
  { value: "fundador", label: "Fundador / C-Level", icon: "Rocket", desc: "Startup ou empresa própria" },
  { value: "rh_estrategico", label: "RH Estratégico", icon: "Building2", desc: "HRBP, Talent Acquisition" },
  { value: "outro", label: "Outro", icon: "User", desc: "Explorar as possibilidades" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [origem, setOrigem] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [showCompanyStep, setShowCompanyStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Share2, Users, Bot, Calendar, Search, Briefcase, Building2, User, Rocket, Target, Coffee,
  };

  useEffect(() => {
    async function checkUserCompany() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("empresa_id, cargo")
            .eq("id", user.id)
            .single();

          if (usuario) {
            setCargo(usuario.cargo || "");
            if (!usuario.empresa_id) {
              setShowCompanyStep(true);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar empresa do usuário:", err);
      }
    }
    checkUserCompany();
  }, []);

  const handleSelectOrigem = (value: string) => {
    setOrigem(value);
    setTimeout(() => setStep(2), 350);
  };

  const handleSelectObjetivo = async (value: string) => {
    setObjetivo(value);
    if (showCompanyStep) {
      setStep(3);
    } else {
      await submitPreferences(value, "");
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa.trim()) {
      setError("O nome da empresa é obrigatório.");
      return;
    }
    await submitPreferences(objetivo, nomeEmpresa.trim());
  };

  const submitPreferences = async (objValue: string, compName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // 1. Se necessário, criar a empresa primeiro
      if (showCompanyStep && compName) {
        const companyRes = await fetch("/api/onboarding", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "company",
            nomeEmpresa: compName,
            cargo: cargo.trim() || "Recrutador",
          }),
        });
        const companyData = await companyRes.json();
        if (!companyRes.ok) {
          throw new Error(companyData.error || "Erro ao criar a empresa.");
        }
      }

      // 2. Salvar telemetria final e concluir onboarding
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem, objetivo: objValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar preferências.");

      await new Promise((r) => setTimeout(r, 600));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  };

  const optionsForStep = step === 1 ? ORIGEM_OPTIONS : OBJETIVO_OPTIONS;
  const selected = step === 1 ? origem : objetivo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-extrabold text-lg">R</span>
        </div>
        <span className="text-[13px] text-gray-400 font-medium">RankHire BR</span>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? "bg-indigo-600 w-6" : "bg-gray-200 w-2"}`} />
        <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? "bg-indigo-600 w-6" : "bg-gray-200 w-2"}`} />
        {showCompanyStep && (
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 3 ? "bg-indigo-600 w-6" : "bg-gray-200 w-2"}`} />
        )}
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">
            {step === 1
              ? "Onde nossa marca cruzou seu caminho?"
              : step === 2
              ? "Qual seu principal objetivo aqui?"
              : "Sobre a sua empresa"}
          </h1>
          <p className="text-[15px] text-gray-500">
            {step === 1
              ? "Isso nos ajuda a entender como as pessoas chegam ao RankHire."
              : step === 2
              ? "Vamos personalizar sua experiência com base no seu perfil."
              : "Precisamos dessas informações para criar sua conta corporativa."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-sm text-red-600 rounded-xl border border-red-200 text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-semibold text-gray-800">Configurando sua conta...</p>
              <p className="text-[13px] text-gray-400 mt-1">Levará apenas um segundo</p>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mt-2" />
          </div>
        ) : (
          <>
            {step < 3 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {optionsForStep.map((option) => {
                  const Icon = ICONS[option.icon];
                  const isSelected = selected === option.value;
                  const handleClick =
                    step === 1
                      ? () => handleSelectOrigem(option.value)
                      : () => handleSelectObjetivo(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={handleClick}
                      className={`relative group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 text-center hover:border-indigo-400 hover:bg-indigo-50/50 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 shadow-md"
                          : "border-gray-200 bg-white hover:shadow-sm"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                        }`}
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`text-[14px] font-semibold ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                          {option.label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{option.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleCompanySubmit} className="bg-white p-8 border rounded-2xl shadow-sm space-y-5 max-w-lg mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    placeholder="Ex: Minha Empresa Ltda"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Cargo</label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Recrutador Sênior"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
                >
                  Concluir Onboarding
                </button>
              </form>
            )}

            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="w-full text-center text-[13px] text-gray-400 mt-6 hover:text-gray-600 transition-colors"
              >
                ← Voltar
              </button>
            )}

            <p className="text-center text-[12px] text-gray-400 mt-4">
              {step === 1
                ? "Selecione uma opção para continuar"
                : step === 2
                ? "Selecione seu perfil para prosseguir"
                : "Insira os dados da empresa para finalizar"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
