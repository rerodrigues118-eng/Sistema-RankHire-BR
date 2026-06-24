"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCachedProfile, setCachedProfile, clearCachedProfile } from "@/lib/profile-cache";
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

export default function ProfileConfig() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [labels, setLabels] = useState<Label[]>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<string>("Sessao atual");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = useMemo(() => {
    const value = nome || profile?.email || "RH";
    return (
      value
        .split(/[ @.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "RH"
    );
  }, [nome, profile?.email]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // hydrate from local cache first so UI doesn't flash empty values
      try {
        const cached = getCachedProfile();
        if (cached) {
          setProfile((p) => p ?? (cached as Profile));
          setNome((prev) => prev || (cached.nome || ""));
          setCargo((prev) => prev || (cached.cargo || ""));
        }
      } catch {}
      const supabase = createClient();

      const [profileRes, labelsRes, sessionRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/profile/labels"),
        supabase.auth.getSession(),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setNome(data.profile?.nome || "");
        setCargo(data.profile?.cargo || "");
        try { setCachedProfile(data.profile); } catch {}
      } else {
        // fallback: use session user info so fields don't disappear
        try {
          const s = await supabase.auth.getUser();
          const u = s.data.user;
          const fallbackProfile: Profile = {
            id: u?.id || "",
            empresa_id: null,
            nome: u?.user_metadata?.name || null,
            email: u?.email || null,
            cargo: null,
            telefone: null,
            avatar_url: u?.user_metadata?.avatar_url || null,
            role: null,
          };
          setProfile((p) => p ?? fallbackProfile);
          setNome((prev) => prev || (u?.user_metadata?.name || ""));
          try { setCachedProfile(fallbackProfile); } catch {}
        } catch {
          // ignore
        }
      }

      if (labelsRes.ok) {
        const data = await labelsRes.json();
        if (Array.isArray(data.labels) && data.labels.length > 0) {
          const merged = DEFAULT_LABELS.map((fallback, index) => data.labels[index] || fallback);
          setLabels(merged);
        }
      }

      const expiresAt = sessionRes.data.session?.expires_at;
      if (expiresAt) {
        setSessionInfo(`Expira em ${new Date(expiresAt * 1000).toLocaleString("pt-BR")}`);
      }

      setLoading(false);
    }

    load().catch(() => {
      setFeedback({ type: "error", text: "Nao foi possivel carregar seu perfil." });
      setLoading(false);
    });
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
      try { setCachedProfile(data.profile); } catch {}
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

    try {
      // simple client validation
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) throw new Error('Tipo de arquivo nao suportado. Use JPG, PNG ou WEBP.');
      if (file.size > 2 * 1024 * 1024) throw new Error('Arquivo maior que 2MB.');

      // always use server-side base64 upload for now (reliable)
      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const result = reader.result as string;
          const base = result.split(',')[1];
          resolve(base);
        };
        reader.readAsDataURL(f);
      });

      const b64 = await toBase64(file);
      const uploadRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg', data: b64 }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        console.error('server upload failed', uploadRes.status, uploadData);
        throw new Error(uploadData.error || 'Erro ao enviar avatar para o servidor.');
      }

      const publicUrl = uploadData.publicUrl;
      if (!publicUrl) throw new Error('Resposta do servidor nao retornou a URL publica.');

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      const updated = await res.json();

      if (!res.ok) {
        console.error('profile PATCH failed', res.status, updated);
        throw new Error(updated.error || 'Erro ao salvar avatar.');
      }

      setProfile(updated.profile);
      try { setCachedProfile(updated.profile); } catch {}
      setFeedback({ type: 'success', text: 'Avatar atualizado.' });
      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated.profile })); } catch {}
      setPreviewUrl(null); setSelectedFile(null);
    } catch (err: unknown) {
      console.error('avatar upload error:', err);
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Nao foi possivel enviar o avatar.' });
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
    const res = await fetch("/api/profile/reset-password", { method: "POST" });
    const data = await res.json();

    setFeedback(res.ok ? { type: "success", text: "Enviamos um link de redefinicao para seu e-mail." } : { type: "error", text: data.error || "Nao foi possivel enviar o reset." });
  }

  // --- Secure change flow (email/phone) via confirmation code ---
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [changeType, setChangeType] = useState<"email" | "phone" | "password" | null>(null);
  const [newValue, setNewValue] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  async function requestChange() {
    if (!changeType) return;
    setRequesting(true);
    setSent(false);
    try {
      if (changeType === "password") {
        // reuse existing flow
        const res = await fetch("/api/profile/reset-password", { method: "POST" });
        if (res.ok) {
          setFeedback({ type: "success", text: "Link de redefinicao enviado por e-mail." });
          setShowSecurityModal(false);
        } else {
          const d = await res.json();
          setFeedback({ type: "error", text: d.error || "Erro ao solicitar reset." });
        }
      } else {
        const res = await fetch("/api/profile/request-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: changeType, newValue }),
        });
        const d = await res.json();
        if (res.ok) {
          setSent(true);
          setFeedback({ type: "success", text: d.message || "Codigo enviado." });
        } else {
          setFeedback({ type: "error", text: d.error || "Erro ao solicitar alteracao." });
        }
      }
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro de rede." });
    } finally {
      setRequesting(false);
    }
  }

  async function verifyChange() {
    if (!changeType) return;
    try {
      const res = await fetch("/api/profile/verify-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: changeType, code, newValue }),
      });
      const d = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: d.message || "Alteracao aplicada." });
        // refresh profile
        const p = await (await fetch('/api/profile')).json();
        setProfile(p.profile);
        try { setCachedProfile(p.profile); } catch {}
        setShowSecurityModal(false);
        setCode("");
        setNewValue("");
        setSent(false);
      } else {
        setFeedback({ type: "error", text: d.error || "Codigo invalido." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro de rede." });
    }
  }

  if (loading) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Perfil e seguranca</h1>
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
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[24px] font-semibold text-slate-500">{initials}</div>
              )}
            </div>
            <div className="mt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Selecionar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    console.log('file selected', f);
                    if (f) {
                      setSelectedFile(f);
                      setPreviewLoadError(false);
                      setFeedback({ type: 'success', text: `Arquivo selecionado: ${f.name}` });
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPreviewUrl(String(reader.result));
                      };
                      reader.onerror = () => setPreviewLoadError(true);
                      reader.readAsDataURL(f);
                    }
                  }}
                />
              </label>

              {previewUrl && (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="relative">
                    {!previewLoadError ? (
                      <img
                        src={previewUrl ?? undefined}
                        alt=""
                        onError={() => setPreviewLoadError(true)}
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full border bg-slate-50 flex items-center justify-center text-slate-500 font-semibold">{initials}</div>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">{selectedFile ? `${selectedFile.name} (${Math.round((selectedFile.size/1024))} KB)` : ''}</div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await handleAvatarUpload(selectedFile ?? undefined); }} disabled={uploadingAvatar} className="px-3 py-1 rounded-md bg-[#1B4FD8] text-white text-sm">{uploadingAvatar ? 'Enviando...' : 'Enviar'}</button>
                    <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); setPreviewLoadError(false); }} className="px-3 py-1 rounded-md border">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setShowSecurityModal(true)} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">
              Redefinir Dados Pessoais
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">Nome completo</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="profile-input" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">Cargo</span>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} className="profile-input" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">E-mail</span>
              <input value={maskEmail(profile?.email || null)} disabled className="profile-input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-500">Telefone</span>
              <input value={maskPhone(profile?.telefone || null)} disabled className="profile-input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button onClick={handleSaveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 rounded-md bg-[#1B4FD8] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#163fb3] disabled:opacity-60">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alteracoes
              </button>
            </div>
          </div>
        </div>
      </section>
      

      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Redefinir informações pessoais</h3>
            <p className="text-sm text-slate-600 mb-4">Escolha o que deseja alterar. Para e-mail e telefone será enviado um código de segurança.</p>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2">
                  <input type="radio" name="changeType" checked={changeType === 'email'} onChange={() => setChangeType('email')} />
                  <span className="ml-2">Alterar e-mail</span>
                </label>
                {changeType === 'email' && (
                  <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Novo e-mail" className="mt-2 w-full profile-input" />
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="radio" name="changeType" checked={changeType === 'phone'} onChange={() => setChangeType('phone')} />
                  <span className="ml-2">Alterar telefone</span>
                </label>
                {changeType === 'phone' && (
                  <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Novo telefone" className="mt-2 w-full profile-input" />
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="radio" name="changeType" checked={changeType === 'password'} onChange={() => setChangeType('password')} />
                  <span className="ml-2">Redefinir senha</span>
                </label>
                {changeType === 'password' && <p className="mt-2 text-sm text-slate-500">Será enviado um link de redefinição para seu e-mail.</p>}
              </div>

              {sent && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Código de segurança</label>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Digite o código recebido" className="w-full profile-input" />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowSecurityModal(false); setChangeType(null); setNewValue(''); setCode(''); setSent(false); }} className="px-3 py-2 rounded-md border">Cancelar</button>
              {!sent ? (
                <button onClick={requestChange} disabled={requesting || !changeType || (changeType !== 'password' && !newValue)} className="px-4 py-2 rounded-md bg-[#1B4FD8] text-white">Enviar código</button>
              ) : (
                <button onClick={verifyChange} className="px-4 py-2 rounded-md bg-[#059669] text-white">Verificar código</button>
              )}
            </div>
          </div>
        </div>
      )}

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

          <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut({ scope: 'global' }); window.location.href = '/login'; }} className="flex items-center justify-between rounded-lg border border-red-200 px-4 py-4 text-left text-red-600 hover:bg-red-50">
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
              <input type="color" value={label.cor} onChange={(e) => setLabels((prev) => prev.map((item, i) => i === index ? { ...item, cor: e.target.value } : item))} className="h-9 w-10 cursor-pointer rounded border border-slate-200 bg-white" aria-label={`Cor da etiqueta ${index + 1}`} />
              <input value={label.nome} onChange={(e) => setLabels((prev) => prev.map((item, i) => i === index ? { ...item, nome: e.target.value } : item))} className="profile-input" placeholder={`Etiqueta ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
