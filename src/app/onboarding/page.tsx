"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Share2,
  Users,
  Bot,
  Calendar,
  Search,
  Briefcase,
  Building2,
  User,
  Rocket,
  Target,
  Coffee,
  Loader2,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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

  // Steps:
  // 1: Origem / Telemetria
  // 2: Objetivo
  // 3: Complemento de Perfil (Senha, Cargo, Telefone - especialmente para Google Auth)
  // 4: Empresa
  // 5: Criar Primeira Vaga (Wizard guiado)
  const [step, setStep] = useState<number>(1);
  const [origem, setOrigem] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  // Vaga wizard state
  const [jobTitle, setJobTitle] = useState("");
  const [jobArea, setJobArea] = useState("Tecnologia");
  const [jobContract, setJobContract] = useState("CLT");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    Share2,
    Users,
    Bot,
    Calendar,
    Search,
    Briefcase,
    Building2,
    User,
    Rocket,
    Target,
    Coffee,
  };

  useEffect(() => {
    async function checkUserSession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const provider = user.app_metadata?.provider;
          if (provider === "google") {
            setIsGoogleAuth(true);
          }

          const { data: usuario } = await supabase
            .from("usuarios")
            .select("empresa_id, cargo, telefone")
            .eq("id", user.id)
            .maybeSingle();

          if (usuario) {
            setCargo(usuario.cargo || "");
            setTelefone(usuario.telefone || "");
          }
        }
      } catch (err) {
        console.error("Erro ao checar sessão no onboarding:", err);
      }
    }
    checkUserSession();
  }, []);

  const handleSelectOrigem = (value: string) => {
    setOrigem(value);
    setTimeout(() => setStep(2), 300);
  };

  const handleSelectObjetivo = (value: string) => {
    setObjetivo(value);
    setTimeout(() => setStep(3), 300);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo.trim()) {
      setError("Informe o seu cargo.");
      return;
    }
    setError(null);
    setStep(4);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa.trim()) {
      setError("O nome da empresa é obrigatório.");
      return;
    }
    setError(null);
    setStep(5);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Se informou senha (ex: usuário Google Auth querendo senha nativa)
      if (senha.trim().length >= 8) {
        await supabase.auth.updateUser({ password: senha.trim() });
      }

      // 2. Criar / atualizar a empresa
      const companyRes = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "company",
          nomeEmpresa: nomeEmpresa.trim() || "Minha Empresa",
          cargo: cargo.trim() || "Recrutador",
          telefone: telefone.trim() || undefined,
        }),
      });
      const companyData = await companyRes.json();
      if (!companyRes.ok) {
        throw new Error(companyData.error || "Erro ao criar a empresa.");
      }

      // 3. Se preencheu a primeira vaga no wizard, cria a vaga
      if (jobTitle.trim()) {
        await fetch("/api/onboarding/vaga", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: jobTitle.trim(),
            jobTitle: jobTitle.trim(),
            area: jobArea,
            contract: jobContract,
          }),
        });
      }

      // 4. Salvar preferências de telemetria
      await fetch("/api/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem, objetivo }),
      });

      await new Promise((r) => setTimeout(r, 600));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao finalizar onboarding.");
      setIsLoading(false);
    }
  };

  const optionsForStep = step === 1 ? ORIGEM_OPTIONS : OBJETIVO_OPTIONS;
  const selected = step === 1 ? origem : objetivo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-900 dark:text-slate-100">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-extrabold text-lg">R</span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
          RankHire BR
        </span>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              step >= s ? "bg-blue-600 w-6" : "bg-slate-200 dark:bg-slate-800 w-2"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {step === 1 && "Onde nossa marca cruzou seu caminho?"}
                {step === 2 && "Qual seu principal objetivo aqui?"}
                {step === 3 && "Complete seu perfil de acesso"}
                {step === 4 && "Sobre a sua empresa"}
                {step === 5 && "Crie sua primeira vaga"}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {step === 1 && "Isso nos ajuda a entender como você chegou ao RankHire."}
                {step === 2 && "Personalizaremos a inteligência da plataforma para você."}
                {step === 3 && "Defina os dados principais para gerenciar suas triagens."}
                {step === 4 && "Insira as informações da sua organização corporativa."}
                {step === 5 && "Configure o cargo para iniciar os testes com IA."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/40 text-xs font-medium text-red-600 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 text-center">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">Configurando sua conta...</p>
                  <p className="text-xs text-slate-400 mt-1">Preparando seu ambiente em instantes</p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mt-2" />
              </div>
            ) : (
              <>
                {step <= 2 && (
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
                          className={`relative group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all text-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs"
                              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-600"
                            }`}
                          >
                            {Icon && <Icon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                              {option.label}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{option.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Perfil (Cargo, Telefone, Senha para Google Auth) */}
                {step === 3 && (
                  <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Seu Cargo / Função *</label>
                      <input
                        type="text"
                        required
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        placeholder="Ex: Headhunter, Talent Acquisition, RH"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / Celular</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(11) 99999-8888"
                          className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {isGoogleAuth && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-blue-600" /> Criar senha nativa (Opcional)
                        </label>
                        <input
                          type="password"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          placeholder="Mínimo 8 caracteres para entrar com e-mail/senha"
                          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Permite fazer login com senha além do Google no futuro.
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Avançar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Step 4: Empresa */}
                {step === 4 && (
                  <form onSubmit={handleCompanySubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa / Consultoria *</label>
                      <input
                        type="text"
                        required
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        placeholder="Ex: Minha Empresa RH"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Avançar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Step 5: Primeira Vaga (Wizard real) */}
                {step === 5 && (
                  <form onSubmit={handleFinalSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título da primeira vaga *</label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Ex: Desenvolvedor React Frontend, Tech Lead"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Área da vaga</label>
                        <select
                          value={jobArea}
                          onChange={(e) => setJobArea(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Design">Design</option>
                          <option value="Produto">Produto</option>
                          <option value="Vendas">Vendas / Comercial</option>
                          <option value="Marketing">Marketing</option>
                          <option value="RH">Recursos Humanos</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Contrato</label>
                        <select
                          value={jobContract}
                          onChange={(e) => setJobContract(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        >
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ</option>
                          <option value="Estágio">Estágio</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" /> Concluir e Acessar Plataforma
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinalSubmit()}
                        className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-600 transition"
                      >
                        Pular criação de vaga agora
                      </button>
                    </div>
                  </form>
                )}

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1))}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors mt-6"
                  >
                    ← Voltar passo
                  </button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
