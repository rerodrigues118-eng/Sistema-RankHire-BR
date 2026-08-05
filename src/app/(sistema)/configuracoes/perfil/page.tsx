"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearCachedProfile } from "@/lib/profile-cache";
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
  User,
  RotateCcw,
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
  { nome: "Alta prioridade", cor: "#2563EB", posicao: 1 },
  { nome: "Bom fit", cor: "#3B82F6", posicao: 2 },
  { nome: "Acompanhar", cor: "#D4AF37", posicao: 3 },
  { nome: "Fora do perfil", cor: "#EF4444", posicao: 4 },
];

export default function PerfilConfigPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [labels, setLabels] = useState<Label[]>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<string>("Sessão atual (Este dispositivo)");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [profileRes, labelsRes] = await Promise.all([
        fetch("/api/profile", { credentials: "include", cache: "no-store" }),
        fetch("/api/profile/labels", { credentials: "include", cache: "no-store" }),
      ]);

      if (!active) return;

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setNome(data.profile?.nome || "Mateus ADM");
        setCargo(data.profile?.cargo || "Desenvolvedor Full-stack");
        setEmail(data.profile?.email || "mateus@empresa.com.br");
        setTelefone(data.profile?.telefone || "(41) 99999-9999");
        if (data.sessionExpiresAt) {
          setSessionInfo(`Sessão atual (Este dispositivo)`);
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
      setFeedback({ type: "error", text: "Não foi possível carregar seu perfil." });
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cargo, telefone }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil.");

      setProfile(data.profile);
      setFeedback({ type: "success", text: "Perfil e dados pessoais atualizados com sucesso." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar perfil." });
    } finally {
      setSavingProfile(false);
    }
  }

  function handleResetForm() {
    if (profile) {
      setNome(profile.nome || "Mateus ADM");
      setCargo(profile.cargo || "Desenvolvedor Full-stack");
      setEmail(profile.email || "mateus@empresa.com.br");
      setTelefone(profile.telefone || "(41) 99999-9999");
      setFeedback({ type: "success", text: "Dados pessoais redefinidos para os valores originais." });
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: data.publicUrl }),
      });
      const updated = await res.json();

      if (!res.ok) throw new Error(updated.error || "Erro ao salvar avatar.");

      setProfile(updated.profile);
      setFeedback({ type: "success", text: "Foto de perfil atualizada com sucesso." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Não foi possível enviar a foto de perfil." });
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar etiquetas.");

      setLabels(data.labels);
      setFeedback({ type: "success", text: "Etiquetas salvas com sucesso." });
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar etiquetas." });
    } finally {
      setSavingLabels(false);
    }
  }

  async function handleResetPassword() {
    setFeedback(null);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", credentials: "include" });
      const data = await res.json();

      setFeedback(
        res.ok
          ? { type: "success", text: "Enviamos um link de redefinição de senha para seu e-mail." }
          : { type: "error", text: data.error || "Não foi possível enviar o link de reset." }
      );
    } catch {
      setFeedback({ type: "error", text: "Erro de conexão ao enviar link de redefinição." });
    }
  }

  async function handleGlobalSignOut() {
    clearCachedProfile();
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Perfil e segurança
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dados da conta, sessões e configurações do usuário.
            </p>
          </div>
          {feedback && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-medium ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Bloco 1: Dados Pessoais */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Dados pessoais</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-[160px_1fr]">
            {/* Avatar Column */}
            <div className="flex flex-col items-center justify-start pt-2">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Selecionar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
                />
              </label>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome completo">
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Mateus ADM"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  />
                </Field>
                <Field label="Cargo">
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Desenvolvedor Full-stack"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  />
                </Field>
                <Field label="E-mail">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mateus@empresa.com.br"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(41) 99999-9999"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition"
                  />
                </Field>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Redefinir Dados Pessoais
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 2: Segurança & Sessões */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Segurança</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Redefinir senha */}
            <button
              onClick={handleResetPassword}
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  Redefinir senha
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  Enviar link por e-mail
                </span>
              </div>
              <KeyRound className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
            </button>

            {/* Card 2: Sessão ativa */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Sessão ativa
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  {sessionInfo}
                </span>
              </div>
              <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
            </div>

            {/* Card 3: Encerrar sessões */}
            <button
              onClick={handleGlobalSignOut}
              className="flex items-center justify-between rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 text-left hover:bg-red-50 dark:hover:bg-red-950/40 transition group"
            >
              <div>
                <span className="block text-xs font-bold text-red-600 dark:text-red-400">
                  Encerrar sessões
                </span>
                <span className="mt-0.5 block text-[11px] text-red-500/80 dark:text-red-400/80">
                  Sair de todos os dispositivos
                </span>
              </div>
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            </button>
          </div>
        </section>

        {/* Bloco 3: Etiquetas personalizadas */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Etiquetas personalizadas</h2>
            </div>
            <button
              onClick={handleSaveLabels}
              disabled={savingLabels}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 shadow-xs"
            >
              {savingLabels ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar etiquetas
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {labels.map((label, index) => (
              <div key={label.posicao} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                <input
                  type="color"
                  value={label.cor}
                  onChange={(event) =>
                    setLabels((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, cor: event.target.value } : item
                      )
                    )
                  }
                  className="h-9 w-10 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  aria-label={`Cor da etiqueta ${index + 1}`}
                />
                <input
                  type="text"
                  value={label.nome}
                  onChange={(event) =>
                    setLabels((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, nome: event.target.value } : item
                      )
                    )
                  }
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 transition"
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
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
