"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building, CheckCircle2, Loader2, Phone, ShieldCheck, User } from "lucide-react";

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

  const [telefone, setTelefone] = useState("");
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
      return "Informe um celular brasileiro valido no formato +55DDDnumero.";
    }

    if (!termosAceitos) {
      return "Voce precisa aceitar os Termos de Servico e a Politica de Privacidade.";
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
        throw new Error(data.error || "Nao foi possivel iniciar a verificacao.");
      }

      setStep(2);
      setIsCodeSent(true);
      setTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar codigo.");
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
        throw new Error(data.error || "Nao foi possivel reenviar o codigo.");
      }

      setTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar o codigo.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(codigo)) {
      setError("Digite o codigo de 6 digitos enviado para o seu e-mail.");
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
        throw new Error(verifyData.error || "Codigo invalido.");
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
      setError(err instanceof Error ? err.message : "Codigo invalido ou expirado.");
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
        throw new Error(bootstrapData.error || "Nao foi possivel concluir o cadastro.");
      }

      router.push(`/onboarding${email ? `?email=${encodeURIComponent(email)}` : ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nao foi possivel concluir o cadastro.");
      setIsLoading(false);
    }
  }

  return (
    <div className="landing-dark min-h-screen flex items-center justify-center bg-[#030307] relative overflow-hidden px-4 select-none">
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="bg-zinc-900/60 border border-white/10 backdrop-blur-md p-8 md:p-10 w-full max-w-md rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#2563EB] to-[#D4AF37] flex items-center justify-center rounded-full mb-3 shadow-lg">
              <span className="text-white font-extrabold text-xl">R</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">RankHire BR</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crie sua conta</h1>
          <p className="text-[13px] text-zinc-400 mt-2 text-center leading-normal">
            Trial gratis com verificacao por e-mail.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${step >= item ? "bg-[#2563EB]" : "bg-white/5"}`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 text-xs font-semibold text-red-400 rounded-lg border border-red-500/20 leading-normal">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={goToVerifyStep} className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs mb-2 uppercase tracking-wider">
              <User className="w-4 h-4 text-[#D4AF37]" />
              Dados basicos
            </div>

            <Field label="Nome completo">
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="auth-input" placeholder="Ex: Gustavo Martins" required />
            </Field>

            <Field label="E-mail corporativo">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="voce@empresa.com.br" required />
            </Field>

            <Field label="Senha">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" placeholder="Minimo 8 caracteres" required />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo">
                <input value={cargo} onChange={(e) => setCargo(e.target.value)} className="auth-input" placeholder="RH" required />
              </Field>
              <Field label="Empresa">
                <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="auth-input" placeholder="Empresa" required />
              </Field>
            </div>

            <Field label="Celular (Apenas para evitar duplicatas)">
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="auth-input"
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
              Proximo passo <ArrowRight className="w-4 h-4" />
            </SubmitButton>

            <button type="button" onClick={() => router.push("/login")} className="w-full text-center text-xs text-zinc-500 hover:text-white py-1.5">
              Ja tem uma conta? <strong className="text-white hover:text-blue-400">Entrar</strong>
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs mb-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Verificacao de E-mail
            </div>

            <div className="text-sm text-zinc-400 mb-4 text-center">
              Enviamos um codigo de 6 digitos para <br/> 
              <strong className="text-white">{email}</strong>
            </div>

            <Field label="Codigo de Verificacao">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="auth-input text-center tracking-[0.4em]"
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
              className="w-full text-center text-xs text-zinc-500 hover:text-white py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : timer > 0 ? `Reenviar em ${timer}s` : "Reenviar codigo"}
            </button>

            <BackButton onClick={() => setStep(1)} />
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs mb-2 uppercase tracking-wider">
              <Building className="w-4 h-4 text-[#D4AF37]" />
              Confirmacao
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-300">
              Telefone confirmado. Falta apenas revisar os dados da empresa.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ opcional">
                <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="auth-input" placeholder="00.000.000/0001-00" />
              </Field>
              <Field label="Tamanho">
                <select value={tamanho} onChange={(e) => setTamanho(e.target.value)} className="auth-input cursor-pointer">
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
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-zinc-400">{label}</label>
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
      className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-full text-xs font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="w-full text-center text-xs text-zinc-500 hover:text-white py-1.5 flex items-center justify-center gap-1"
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
    <div className="space-y-3 pt-4 border-t border-white/5">
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={termosAceitos}
          onChange={(e) => setTermosAceitos(e.target.checked)}
          className="mt-1 accent-blue-500 w-4 h-4 rounded border-white/10 bg-zinc-950"
        />
        <span className="text-[11px] text-zinc-400 leading-snug">
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="text-[#2563EB] font-bold hover:underline">Termos de Servico</Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="text-[#2563EB] font-bold hover:underline">Politica de Privacidade</Link>
        </span>
      </label>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={aceitaMarketing}
          onChange={(e) => setAceitaMarketing(e.target.checked)}
          className="mt-1 accent-blue-500 w-4 h-4 rounded border-white/10 bg-zinc-950"
        />
        <span className="text-[11px] text-zinc-400 leading-snug">
          Aceito receber novidades e dicas de recrutamento por e-mail
        </span>
      </label>
    </div>
  );
}
