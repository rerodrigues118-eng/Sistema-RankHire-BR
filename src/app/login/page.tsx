import LoginForm from "./login-form";

export const metadata = {
  title: "RankHire BR | Entrar",
  description: "Acesse sua conta para continuar recrutando com IA.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reset?: string; plan?: string; source?: string; error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const showResetSuccess = resolvedParams?.reset === "1";
  const plan = resolvedParams?.plan;
  const source = resolvedParams?.source;
  const urlError = resolvedParams?.error;
  const planLabel =
    plan === "starter"
      ? "Starter"
      : plan === "pro"
      ? "Pro"
      : plan === "agencia"
      ? "Agência"
      : plan === "trial"
      ? "Trial"
      : null;

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 select-none">
      {/* Left Column: Visual & Branding (Desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-slate-950 text-white relative overflow-hidden p-12 lg:p-16 border-r border-slate-800">
        {/* Ambient glow light effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-sky-400/10 blur-3xl rounded-full pointer-events-none -z-0 animate-pulse-slow" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-7 h-7 border border-white/20 rounded-md bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-sm">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-[1px]" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">RankHire BR</span>
        </div>

        {/* Hero Branding Content */}
        <div className="relative z-10 my-auto max-w-lg text-left">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1.5 mb-6 text-xs text-blue-300 font-medium backdrop-blur-sm">
            <span>✨ +500.000 currículos processados com precisão semântica</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-4">
            A forma mais inteligente de recrutar.
          </h1>
          <p className="text-base text-slate-400 leading-relaxed font-normal">
            Nossa inteligência artificial analisa currículos em segundos e acelera o fechamento de vagas de ponta a ponta.
          </p>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © 2026 RankHire BR. Plataforma de recrutamento semântico autônomo.
        </div>
      </div>

      {/* Right Column: Clean Light Mode Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-20 bg-white relative z-10">
        <div className="w-full max-w-[380px]">
          {/* Logo (Mobile only) */}
          <div className="mb-8 lg:hidden flex items-center gap-2.5 justify-center">
            <div className="w-7 h-7 border border-slate-300 rounded-md bg-slate-100 flex items-center justify-center shadow-sm">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-[1px]" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">RankHire BR</span>
          </div>

          {/* Form Header */}
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-sm">Acesse sua conta para continuar gerenciando suas vagas.</p>
          </div>

          {showResetSuccess && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium">
              Sua senha foi redefinida com sucesso. Faça login novamente.
            </div>
          )}

          {planLabel && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-800 font-medium">
              Você chegou aqui via landing page para o plano <strong>{planLabel}</strong>. Faça login ou crie sua conta para continuar.
            </div>
          )}

          <LoginForm plan={plan} source={source} urlError={urlError} />
        </div>
      </div>
    </div>
  );
}
