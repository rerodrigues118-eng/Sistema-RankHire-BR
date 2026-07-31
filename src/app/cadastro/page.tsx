"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building, CheckCircle2, Loader2, ShieldCheck, User } from "lucide-react";

const BR_PHONE_REGEX = /^\+55[1-9]{2}[6-9]\d{8}$/;
const TERMS_VERSION = "v2.0-2026-06";

function normalizeBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

export default function CadastroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [cargo, setCargo] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [aceitaMarketing, setAceitaMarketing] = useState(false);

  const [telefone, setTelefone] = useState("+55");
  const [codigo, setCodigo] = useState("");

  const [cnpj, setCnpj] = useState("");
  const [tamanho, setTamanho] = useState("1-10");

  const normalizedPhone = useMemo(() => normalizeBrazilPhone(telefone), [telefone]);
  const isPhoneValid = BR_PHONE_REGEX.test(normalizedPhone);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  function validateBasicData() {
    if (!nome.trim() || !email.trim() || !password.trim() || !cargo.trim() || !nomeEmpresa.trim() || !telefone.trim()) {
      return "Preencha todos os campos e o telefone.";
    }

    if (password.length < 8) {
      return "A senha precisa ter pelo menos 8 caracteres.";
    }

    if (!isPhoneValid) {
      return "Informe um celular brasileiro válido no formato +55DDDnumero.";
    }

    if (!termosAceitos) {
      return "Você precisa aceitar os Termos de Serviço e a Política de Privacidade.";
    }

    return null;
  }

  async function goToVerifyStep(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateBasicData();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone: normalizedPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível iniciar a verificação.");
      }

      setStep(2);
      setIsCodeSent(true);
      setTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setIsSendingCode(true);

    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, telefone: normalizedPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível reenviar o código.");
      }

      setTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o código.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(codigo)) {
      setError("Digite o código de 6 dígitos enviado para o seu e-mail.");
      return;
    }

    setIsLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: codigo }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Código inválido.");
      }

      // Cria a conta no Supabase confirmada e com metadados
      const registerRes = await fetch("/api/auth/register-verified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nome, cargo, empresa: nomeEmpresa }),
      });
      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.error || "Erro ao criar conta.");
      }

      // Faz login com as credenciais cadastradas
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const bootstrap = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "company",
          nome,
          email,
          cargo,
          telefone: normalizedPhone,
          nomeEmpresa,
          cnpj,
          tamanho,
          segmento: "Tecnologia",
          termosAceitos,
          termosVersao: TERMS_VERSION,
          consentimentoMarketing: aceitaMarketing,
        }),
      });

      const bootstrapData = await bootstrap.json();

      if (!bootstrap.ok) {
        throw new Error(bootstrapData.error || "Não foi possível concluir o cadastro.");
      }

      router.push(`/onboarding${email ? `?email=${encodeURIComponent(email)}` : ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900 select-none">
      {/* Left Column: Visual & Branding (Desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-slate-950 text-white relative overflow-hidden p-12 lg:p-16 border-r border-slate-800">
        {/* Ambient glow light effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-sky-400/10 blur-3xl rounded-full pointer-events-none -z-0" />

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

      {/* Right Column: Clean Light Mode Register Form */}
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
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Crie sua conta</h2>
            <p className="text-slate-500 text-sm">Cadastre-se gratuitamente para iniciar seu trial de 3 dias.</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  step >= item ? "bg-blue-600" : "bg-slate-100"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 text-xs font-semibold text-red-700 rounded-xl border border-red-200 leading-normal">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={goToVerifyStep} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-2 uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-600" />
                Dados básicos
              </div>

              <Field label="Nome completo">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="Ex: Gustavo Martins"
                  required
                />
              </Field>

              <Field label="E-mail corporativo">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="voce@empresa.com.br"
                  required
                />
              </Field>

              <Field label="Senha">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cargo">
                  <input
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="RH"
                    required
                  />
                </Field>
                <Field label="Empresa">
                  <input
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="Nome da Empresa"
                    required
                  />
                </Field>
              </div>

              <Field label="Celular / WhatsApp">
                <input
                  value={telefone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val.startsWith("+55")) {
                      if (val === "" || val === "+" || val === "+5" || val === "5" || val === "55") {
                        setTelefone("+55");
                      } else {
                        setTelefone("+55" + val.replace(/^\+?55/, ""));
                      }
                    } else {
                      setTelefone(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="+5511999999999"
                  inputMode="tel"
                  required
                />
              </Field>

              <ConsentChecks
                termosAceitos={termosAceitos}
                setTermosAceitos={setTermosAceitos}
                aceitaMarketing={aceitaMarketing}
                setAceitaMarketing={setAceitaMarketing}
              />

              <SubmitButton disabled={!termosAceitos} loading={isLoading}>
                Próximo passo <ArrowRight className="w-4 h-4" />
              </SubmitButton>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full text-center text-xs text-slate-500 hover:text-blue-600 py-1.5 transition-colors"
              >
                Já tem uma conta? <strong className="text-blue-600 font-bold">Entrar</strong>
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Verificação de E-mail
              </div>

              <div className="text-sm text-slate-500 mb-4 text-center leading-normal">
                Enviamos um código de 6 dígitos para o e-mail: <br />
                <strong className="text-slate-800">{email}</strong>
              </div>

              <Field label="Código de Verificação">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 text-center tracking-[0.4em] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  placeholder="000000"
                  inputMode="numeric"
                  required
                />
              </Field>

              <SubmitButton disabled={!isCodeSent || codigo.length !== 6} loading={isLoading}>
                Confirmar E-mail <CheckCircle2 className="w-4 h-4" />
              </SubmitButton>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingCode || timer > 0}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSendingCode ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : timer > 0 ? (
                  `Reenviar em ${timer}s`
                ) : (
                  "Reenviar código"
                )}
              </button>

              <BackButton onClick={() => setStep(1)} />
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-2 uppercase tracking-wider">
                <Building className="w-4 h-4 text-blue-600" />
                Confirmação
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                E-mail verificado com sucesso. Preencha os detalhes adicionais abaixo.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="CNPJ (opcional)">
                  <input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="00.000.000/0001-00"
                  />
                </Field>
                <Field label="Tamanho da Empresa">
                  <select
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition cursor-pointer"
                  >
                    <option value="1-10">1 a 10 func.</option>
                    <option value="11-50">11 a 50 func.</option>
                    <option value="51-200">51 a 200 func.</option>
                    <option value="200+">Mais de 200 func.</option>
                  </select>
                </Field>
              </div>

              <SubmitButton loading={isLoading}>
                Finalizar cadastro <CheckCircle2 className="w-4 h-4" />
              </SubmitButton>

              <BackButton onClick={() => setStep(2)} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function SubmitButton({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1.5 flex items-center justify-center gap-1 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Voltar
    </button>
  );
}

function ConsentChecks({
  termosAceitos,
  setTermosAceitos,
  aceitaMarketing,
  setAceitaMarketing,
}: {
  termosAceitos: boolean;
  setTermosAceitos: (value: boolean) => void;
  aceitaMarketing: boolean;
  setAceitaMarketing: (value: boolean) => void;
}) {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={termosAceitos}
          onChange={(e) => setTermosAceitos(e.target.checked)}
          className="mt-1 accent-blue-600 w-4 h-4 rounded border-slate-300"
        />
        <span className="text-[11px] text-slate-500 leading-snug">
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="text-blue-600 font-bold hover:underline">
            Termos de Serviço
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="text-blue-600 font-bold hover:underline">
            Política de Privacidade
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={aceitaMarketing}
          onChange={(e) => setAceitaMarketing(e.target.checked)}
          className="mt-1 accent-blue-600 w-4 h-4 rounded border-slate-300"
        />
        <span className="text-[11px] text-slate-500 leading-snug">
          Aceito receber novidades e dicas de recrutamento por e-mail
        </span>
      </label>
    </div>
  );
}
