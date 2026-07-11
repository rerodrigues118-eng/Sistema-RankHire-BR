import LoginForm from "./login-form";
import SignupInlineCta from "./signup-inline-cta";

export const metadata = {
  title: "RankHire BR | Entrar",
  description: "Acesse sua conta para continuar recrutando com IA.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reset?: string; plan?: string; source?: string }>;
}) {
  const resolvedParams = await searchParams;
  const showResetSuccess = resolvedParams?.reset === "1";
  const plan = resolvedParams?.plan;
  const source = resolvedParams?.source;
  const planLabel = plan === "starter"
    ? "Starter"
    : plan === "pro"
      ? "Pro"
      : plan === "agencia"
        ? "Agência"
        : plan === "trial"
          ? "Trial"
          : null;

  return (
    <div className="landing-dark min-h-screen flex bg-[#030307] font-sans text-white relative overflow-hidden select-none">
      {/* Background glowing backlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Column: Visual & Promo (Desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-zinc-950/20 border-r border-white/5 relative overflow-hidden px-16">
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#2563EB] to-[#D4AF37] flex items-center justify-center rounded-full shadow-lg mb-8">
            <span className="text-white font-extrabold text-2xl">R</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4">
            A forma mais inteligente de recrutar.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            Nossa inteligência artificial analisa currículos em segundos, encontra os melhores perfis no LinkedIn e acelera o fechamento de vagas de ponta a ponta.
          </p>
          <SignupInlineCta plan={plan} source={source} />
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative z-10">
        <div className="w-full max-w-[360px]">
          {/* Logo (Mobile only) */}
          <div className="mb-8 lg:hidden flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#2563EB] to-[#D4AF37] flex items-center justify-center rounded-full shadow-md mb-3">
              <span className="text-white font-extrabold text-xl">R</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">RankHire BR</h1>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Bem-vindo de volta</h2>
            <p className="text-zinc-500 text-xs">Acesse sua conta para continuar gerenciando suas vagas.</p>
          </div>

          {showResetSuccess ? (
            <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              Sua senha foi redefinida com sucesso. Faça login novamente.
            </div>
          ) : null}

          {planLabel ? (
            <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-100">
              Você chegou aqui via landing page para o plano {planLabel}. Faça login ou crie sua conta para continuar.
            </div>
          ) : null}

          <LoginForm plan={plan} source={source} />
        </div>
      </div>
    </div>
  );
}
