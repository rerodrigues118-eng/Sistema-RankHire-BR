"use client";

import { useEffect, useMemo, useState } from "react";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Profile = {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  email: string | null;
  cargo: string | null;
  telefone: string | null;
  avatar_url: string | null;
  role: string | null;
};

type Label = {
  id?: string;
  nome: string;
  cor: string;
  posicao: number;
};

const DEFAULT_LABELS: Label[] = [
  { nome: "Alta prioridade", cor: "#06D6A0", posicao: 1 },
  { nome: "Bom fit", cor: "#1B4FD8", posicao: 2 },
  { nome: "Acompanhar", cor: "#D4AF37", posicao: 3 },
  { nome: "Fora do perfil", cor: "#EF4444", posicao: 4 },
];

function maskEmail(email: string | null) {
  if (!email || !email.includes("@")) return "E-mail nao informado";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

function maskPhone(phone: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";
  if (digits.length < 4) return "Telefone nao informado";
  return `** ** *****-${digits.slice(-2)}`;
}

export default function PerfilConfigPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [labels, setLabels] = useState<Label[]>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<string>("Sessao atual");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = useMemo(() => {
    const value = nome || profile?.email || "RH";
    return value
      .split(/[ @.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "RH";
  }, [nome, profile?.email]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [profileRes, labelsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/profile/labels"),
      ]);

      if (!active) return;

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setNome(data.profile?.nome || "");
        setCargo(data.profile?.cargo || "");
        if (data.sessionExpiresAt) {
          setSessionInfo(`Expira em ${new Date(data.sessionExpiresAt * 1000).toLocaleString("pt-BR")}`);
        }
      }

      if (labelsRes.ok) {
        const data = await labelsRes.json();
        if (Array.isArray(data.labels) && data.labels.length > 0) {
          const merged = DEFAULT_LABELS.map((fallback, index) => data.labels[index] || fallback);
          setLabels(merged);
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!active) return;
      setFeedback({ type: "error", text: "Nao foi possivel carregar seu perfil." });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cargo }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil.");

      setProfile(data.profile);
      setFeedback({ type: "success", text: "Perfil atualizado." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar perfil." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarUpload(file: File | undefined) {
    if (!file || !profile?.id) return;

    setUploadingAvatar(true);
    setFeedback(null);
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: data.publicUrl }),
      });
      const updated = await res.json();

      if (!res.ok) throw new Error(updated.error || "Erro ao salvar avatar.");

      setProfile(updated.profile);
      setFeedback({ type: "success", text: "Avatar atualizado." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Nao foi possivel enviar o avatar." });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveLabels() {
    setSavingLabels(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/profile/labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar etiquetas.");

      setLabels(data.labels);
      setFeedback({ type: "success", text: "Etiquetas salvas." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar etiquetas." });
    } finally {
      setSavingLabels(false);
    }
  }

  async function handleResetPassword() {
    setFeedback(null);
    const res = await fetch("/api/auth/reset-password", { method: "POST" });
    const data = await res.json();

    setFeedback(
      res.ok
        ? { type: "success", text: "Enviamos um link de redefinicao para seu e-mail." }
        : { type: "error", text: data.error || "Nao foi possivel enviar o reset." },
    );
  }

  async function handleGlobalSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao sistema
            </Link>
            <h1 className="text-[26px] font-semibold tracking-tight">Perfil e seguranca</h1>
            <p className="mt-1 text-sm text-slate-500">Dados da conta, sessoes e etiquetas da empresa.</p>
          </div>
          {feedback && (
            <div className={`rounded-lg border px-4 py-3 text-[13px] font-medium ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
              {feedback.text}
            </div>
          )}
        </div>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-[#1B4FD8]" />
            <h2 className="text-[16px] font-semibold">Dados pessoais</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar do usuário" width={96} height={96} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[24px] font-semibold text-slate-500">
                    {initials}
                  </div>
                )}
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Avatar
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarUpload(event.target.files?.[0])} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo">
                <input value={nome} onChange={(event) => setNome(event.target.value)} className="profile-input" />
              </Field>
              <Field label="Cargo">
                <input value={cargo} onChange={(event) => setCargo(event.target.value)} className="profile-input" />
              </Field>
              <Field label="E-mail">
                <input value={maskEmail(profile?.email || null)} disabled className="profile-input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
              </Field>
              <Field label="Telefone">
                <input value={maskPhone(profile?.telefone || null)} disabled className="profile-input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <button onClick={handleSaveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 rounded-md bg-[#1B4FD8] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#163fb3] disabled:opacity-60">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar alteracoes
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1B4FD8]" />
            <h2 className="text-[16px] font-semibold">Seguranca</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button onClick={handleResetPassword} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-4 text-left hover:bg-slate-50">
              <span>
                <span className="block text-[13px] font-semibold">Redefinir senha</span>
                <span className="mt-1 block text-xs text-slate-500">Link por e-mail</span>
              </span>
              <KeyRound className="h-4 w-4 text-slate-400" />
            </button>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-4">
              <span>
                <span className="block text-[13px] font-semibold">Sessao ativa</span>
                <span className="mt-1 block text-xs text-slate-500">{sessionInfo}</span>
              </span>
              <Monitor className="h-4 w-4 text-slate-400" />
            </div>

            <button onClick={handleGlobalSignOut} className="flex items-center justify-between rounded-lg border border-red-200 px-4 py-4 text-left text-red-600 hover:bg-red-50">
              <span>
                <span className="block text-[13px] font-semibold">Encerrar sessoes</span>
                <span className="mt-1 block text-xs text-red-400">Sair de todos os dispositivos</span>
              </span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#1B4FD8]" />
              <h2 className="text-[16px] font-semibold">Etiquetas personalizadas</h2>
            </div>
            <button onClick={handleSaveLabels} disabled={savingLabels} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
              {savingLabels ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar etiquetas
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {labels.map((label, index) => (
              <div key={label.posicao} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  type="color"
                  value={label.cor}
                  onChange={(event) => setLabels((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, cor: event.target.value } : item))}
                  className="h-9 w-10 cursor-pointer rounded border border-slate-200 bg-white"
                  aria-label={`Cor da etiqueta ${index + 1}`}
                />
                <input
                  value={label.nome}
                  onChange={(event) => setLabels((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, nome: event.target.value } : item))}
                  className="profile-input"
                  placeholder={`Etiqueta ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
