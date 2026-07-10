"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Candidate, Job, KanbanStatus, PageId, UploadFile } from "@/lib/types";
import { AVATAR_COLORS } from "@/lib/mock-data";
import Sidebar from "@/components/sidebar";
import DashboardPage from "@/components/pages/dashboard-page";
import PdfRankerPage from "@/components/pages/pdf-ranker-page";
import LinkedinPage from "@/components/pages/linkedin-page";
import PipelinePage from "@/components/pages/pipeline-page";
import AnalyticsPage from "@/components/pages/analytics-page";
import SettingsPage from "@/components/pages/settings-page";
import VagasPage from "@/components/pages/vagas-page";
import AgenteIAPage from "@/components/pages/agente-ia-page";
import CandidatosPage from "@/components/pages/candidatos-page";
import CandidateDrawer from "@/components/CandidateDrawer";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    try { return (sessionStorage.getItem('rh_activePage') as PageId) || 'dashboard'; } catch { return 'dashboard'; }
  });
  const [selectedJobId, setSelectedJobId] = useState(() => {
    try { return sessionStorage.getItem('rh_selectedJobId') || ''; } catch { return ''; }
  });
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{
    isAdmin: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    plano: string;
    mes: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeJob = jobs.find((job) => job.id === selectedJobId) || jobs[0] || null;

  // Persiste a página ativa no sessionStorage
  const handleSetActivePage = useCallback((page: PageId) => {
    setActivePage(page);
    try { sessionStorage.setItem('rh_activePage', page); } catch { /* ignore */ }
  }, []);

  // Persiste a vaga selecionada no sessionStorage
  const handleSetSelectedJobId = useCallback((id: string) => {
    setSelectedJobId(id);
    try { sessionStorage.setItem('rh_selectedJobId', id); } catch { /* ignore */ }
  }, []);

  const handleOpenDrawer = useCallback((candidate: Candidate) => setDrawerCandidate(candidate), []);
  const handleCloseDrawer = useCallback(() => setDrawerCandidate(null), []);
  const handleUpdateCandidate = useCallback((updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const refreshAppData = useCallback(async () => {
    try {
      const res = await fetch("/api/app-data");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao carregar os dados do app.");
      }

      if (Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setSelectedJobId((prev) => {
          const restored = sessionStorage.getItem('rh_selectedJobId');
          const valid = data.jobs.find((j: Job) => j.id === (restored || prev));
          const chosen = valid?.id || data.jobs[0]?.id || '';
          try { sessionStorage.setItem('rh_selectedJobId', chosen); } catch { /* ignore */ }
          return chosen;
        });
      } else {
        setJobs([]);
        setSelectedJobId("");
      }

      if (Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        setCandidates([]);
      }

      if (data.quota) {
        setQuota(data.quota);
      }
    } catch (error: unknown) {
      setBootstrapError(error instanceof Error ? error.message : "Falha ao carregar os dados do app.");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAppData() {
      setIsBootstrapping(true);
      setBootstrapError(null);

      try {
        await refreshAppData();
      } finally {
        if (alive) {
          setIsBootstrapping(false);
        }
      }
    }

    loadAppData();

    return () => {
      alive = false;
    };
  }, [refreshAppData]);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setJobs([]);
        setCandidates([]);
        setQuota(null);
        setSelectedJobId("");
        setBootstrapError(null);
        setIsBootstrapping(false);
        return;
      }

      if (event === "SIGNED_IN") {
        setBootstrapError(null);
        setIsBootstrapping(true);
        try {
          await refreshAppData();
        } finally {
          setIsBootstrapping(false);
        }
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        refreshAppData();
      }

      if (!session) {
        setJobs([]);
        setCandidates([]);
        setQuota(null);
        setSelectedJobId("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAppData]);

  const handleToggleShortlist = useCallback((id: string) => {
    fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortlist: !candidates.find((candidate) => candidate.id === id)?.shortlist,
      }),
    }).catch(() => {});
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, shortlist: !candidate.shortlist } : candidate)));
  }, [candidates]);

  const handleMoveCandidateStatus = useCallback((id: string, newStatus: KanbanStatus) => {
    fetch(`/api/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});
    setCandidates((prev) => prev.map((candidate) => (candidate.id === id ? { ...candidate, status: newStatus } : candidate)));
  }, []);

  const handleResetPipeline = useCallback(() => {
    setCandidates((prev) => prev.map((candidate) => ({ ...candidate, status: "triado" })));
  }, []);

  const handleImportCandidate = useCallback(
    async (candidate: Candidate) => {
      if (!activeJob) return;

      await fetch("/api/apify-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: candidate.linkedinUrl,
          vagaId: activeJob.id,
          candidateName: candidate.name,
        }),
      });

      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candidate.name,
          role: candidate.role,
          company: candidate.company,
          city: candidate.city,
          linkedinUrl: candidate.linkedinUrl,
          score: candidate.score,
          status: candidate.status,
        }),
      });

      const data = await res.json();
      const persistedId = res.ok && data.candidate?.id ? data.candidate.id : `cand-imp-${Date.now()}`;

      const imported: Candidate = {
        ...candidate,
        id: persistedId,
        status: "triado",
      };

      setCandidates((prev) => [imported, ...prev]);
    },
    [activeJob]
  );

  const addCandidateFromData = useCallback((candData: Record<string, unknown>, batchData: Record<string, unknown>) => {
    const actualScore = (candData.score_final as number | null) ?? (candData.score as number | null);
    if (actualScore == null) return;

    const file_url = (candData.file_url as string) || "";
    const fallbackBasename =
      file_url.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") || "Candidato";
    const parts = fallbackBasename.split(" ").filter(Boolean);
    const fallbackName =
      parts.length >= 2
        ? `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`
        : fallbackBasename;

    const finalName = (candData.nome_candidato as string | null) || fallbackName;
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    // Se file_url não está direto no candData, busca em batchData.candidates (polling antigo)
    const effectiveFileUrl = file_url || (() => {
      const batchCandidates = batchData.candidates as Array<Record<string, unknown>> | undefined;
      const candMeta = batchCandidates?.find((c) => c.id === candData.id);
      return (candMeta?.file_url as string) || "";
    })();

    const newCand: Candidate = {
      id: candData.id as string,
      name: finalName,
      role: activeJob?.title || "Vaga selecionada",
      company: (candData.empresa_atual as string | null) || "Via upload",
      city: (candData.cidade as string | null) || "Não informado",
      score: actualScore as number,
      avatarColor: color,
      initials: finalName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      confirmedTags: ["Extraído via AI"],
      partialTags: [],
      otherTags: [],
      shortlist: false,
      status: "triado" as KanbanStatus,
      linkedinUrl: (candData.linkedin_url as string | null) || "#",
      createdAt: new Date().toISOString(),
      // Mapeando campos extras extraídos pela IA para os campos da interface Candidate
      email: (candData.email_contato as string | null) || undefined,
      phone: (candData.telefone as string | null) || undefined,
      pretensaoSalarial: (candData.pretensao_salarial as string | null) || undefined,
      disponibilidade: (candData.disponibilidade as string | null) || undefined,
      regime: (candData.regime_preferido as string | null) || undefined,
      aiSummary: (candData.resumo_ia as string | null) || undefined,
      // Campos extras novos
      emailContato: candData.email_contato as string | null | undefined,
      telefone: candData.telefone as string | null | undefined,
      cargoAtual: candData.cargo_atual as string | null | undefined,
      regimePreferido: candData.regime_preferido as string | null | undefined,
      resumoIa: candData.resumo_ia as string | null | undefined,
    };

    void effectiveFileUrl; // usado apenas para referência de fallback

    setCandidates((prev) => {
      if (prev.some((c) => c.id === newCand.id)) return prev;
      return [newCand, ...prev];
    });

    setUploads((prev) => {
      const pending = prev.filter((u) => u.status !== "completed" && u.status !== "failed");
      if (pending.length === 0) setIsUploading(false);
      return prev;
    });
  }, [activeJob]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activeJob) return;

      const supabase = createClient();
      setIsUploading(true);

      const newUploads: UploadFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        progress: 10,
        status: "uploading",
      }));

      const startIndex = uploads.length;
      setUploads((prev) => [...prev, ...newUploads]);

      const storagePaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${activeJob.id}/${fileName}`;

        const { data, error } = await supabase.storage.from("curriculos").upload(filePath, file);

        if (error) {
          setUploads((prev) => {
            const next = [...prev];
            if (next[startIndex + i]) next[startIndex + i] = { ...next[startIndex + i], status: "failed" };
            return next;
          });
        } else if (data) {
          storagePaths.push(data.path);
          setUploads((prev) => {
            const next = [...prev];
            if (next[startIndex + i]) {
              next[startIndex + i] = {
                ...next[startIndex + i],
                status: "extracting",
                storagePath: data.path,
                progress: 50,
              };
            }
            return next;
          });
        }
      }

      if (storagePaths.length === 0) {
        setIsUploading(false);
        return;
      }

      const res = await fetch("/api/upload-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePaths, vaga_id: activeJob.id }),
      });
      const batchData = await res.json();

      if (!res.ok || !batchData.batch_id) {
        setIsUploading(false);
        return;
      }

      supabase
        .channel(`batch-${batchData.batch_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pdf_candidates",
          },
          (payload) => {
            const candData = payload.new as {
              id: string;
              score: number | null;
              score_final?: number | null;
              nome_candidato: string | null;
            };

            const actualScore = candData.score_final ?? candData.score;
            if (actualScore == null) return;

            addCandidateFromData(candData, batchData);
          }
        )
        .subscribe();

      // Se o processamento foi inline (candidatos ja vem na resposta), adiciona direto
      if (Array.isArray(batchData.candidates)) {
        for (const cand of batchData.candidates) {
          const score = cand.score_final ?? cand.score;
          if (score != null) {
            setUploads((prev) =>
              prev.map((u) =>
                u.storagePath === cand.file_url
                  ? { ...u, status: "completed", progress: 100 }
                  : u
              )
            );
            addCandidateFromData(cand, batchData);
          }
        }
        setIsUploading(false);
      } else {
        // Polling fallback: para versoes antigas ou quando o processamento e async
        let pollAttempts = 0;
        const maxPollAttempts = 20; // max 60s de polling (20 * 3s)
        const pendingPaths = new Set(storagePaths);
        const pollTimer = setInterval(async () => {
          pollAttempts++;
          if (pendingPaths.size === 0 || pollAttempts >= maxPollAttempts) {
            clearInterval(pollTimer);
            setIsUploading(false);
            return;
          }
          try {
            const batchRes = await fetch(`/api/batches/${batchData.batch_id}`);
            // Para o polling imediatamente se der 404 (batch nao existe)
            if (batchRes.status === 404) {
              clearInterval(pollTimer);
              setIsUploading(false);
              return;
            }
            if (!batchRes.ok) return;
            const batchPoll = await batchRes.json();
            if (Array.isArray(batchPoll.candidates)) {
              for (const cand of batchPoll.candidates) {
                const score = cand.score_final ?? cand.score;
                if (score != null && pendingPaths.has(cand.file_url)) {
                  pendingPaths.delete(cand.file_url);
                  setUploads((prev) =>
                    prev.map((u) =>
                      u.storagePath === cand.file_url
                        ? { ...u, status: "completed", progress: 100 }
                        : u
                    )
                  );
                  addCandidateFromData(cand, batchData);
                }
              }
            }
            if (batchPoll.status === "completed" || pendingPaths.size === 0) {
              clearInterval(pollTimer);
              setIsUploading(false);
            }
          } catch {
            // ignore polling errors
          }
        }, 3000);

        // Cleanup timer apos 1 minuto no maximo
        setTimeout(() => { clearInterval(pollTimer); setIsUploading(false); }, 60_000);
      }

      e.target.value = "";
    },
    [activeJob, uploads.length, addCandidateFromData]
  );

  // renderPage function removed as we now render all pages and hide them with CSS

  if (isBootstrapping) {
    return (
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar activePage={activePage} onNavigate={handleSetActivePage} />
        <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-3 w-72 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar activePage={activePage} onNavigate={handleSetActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--bg-base)]">
        <main className="flex-1 overflow-y-auto p-6 text-[var(--text-primary)]">
          {bootstrapError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {bootstrapError}
            </div>
          )}
          <div className="w-full h-full relative">
            <div className={activePage === "dashboard" ? "block h-full" : "hidden"}>
              <DashboardPage
                activeJob={activeJob}
                jobs={jobs}
                candidates={candidates}
                onToggleShortlist={handleToggleShortlist}
                onSelectCandidate={handleOpenDrawer}
              />
            </div>
            <div className={activePage === "pdf-ranker" ? "block h-full" : "hidden"}>
              {!activeJob ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
                  Crie ou selecione uma vaga para usar o PDF Ranker.
                </div>
              ) : (
                <PdfRankerPage
                  activeJob={activeJob}
                  candidates={candidates}
                  uploads={uploads}
                  isUploading={isUploading}
                  onFileUpload={handleFileUpload}
                  fileInputRef={fileInputRef}
                  onSelectCandidate={handleOpenDrawer}
                  quota={quota}
                />
              )}
            </div>
            <div className={activePage === "linkedin" ? "block h-full" : "hidden"}>
              {!activeJob ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
                  Crie ou selecione uma vaga para buscar candidatos no LinkedIn.
                </div>
              ) : (
                <LinkedinPage activeJob={activeJob} onImportCandidate={handleImportCandidate} />
              )}
            </div>
            <div className={activePage === "pipeline" ? "block h-full" : "hidden"}>
              <PipelinePage
                candidates={candidates}
                onMoveCandidate={handleMoveCandidateStatus}
                onResetPipeline={handleResetPipeline}
                onSelectCandidate={handleOpenDrawer}
              />
            </div>
            <div className={activePage === "analytics" ? "block h-full" : "hidden"}>
              <AnalyticsPage jobs={jobs} candidates={candidates} quota={quota} />
            </div>
            <div className={activePage === "settings" ? "block h-full" : "hidden"}>
              <SettingsPage />
            </div>
            <div className={activePage === "agente-ia" ? "block h-full" : "hidden"}>
              <AgenteIAPage />
            </div>
            <div className={activePage === "candidatos" ? "block h-full" : "hidden"}>
              <CandidatosPage candidates={candidates} onSelectCandidate={handleOpenDrawer} />
            </div>
            <div className={activePage === "vagas" ? "block h-full" : "hidden"}>
              <VagasPage
                jobs={jobs}
                onCreateJob={async (newJob) => {
                  const res = await fetch("/api/vagas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: newJob.title,
                      area: newJob.department,
                      contract: newJob.contract,
                      location: newJob.location,
                      briefing: newJob.briefing,
                      status: newJob.status,
                    }),
                  });
                  const data = await res.json();

                  if (!res.ok) {
                    throw new Error(data.error || "Falha ao criar a vaga.");
                  }

                  const createdJob: Job = {
                    ...newJob,
                    id: data.vaga.id,
                    createdDate: new Date(data.vaga.created_at).toLocaleDateString("pt-BR"),
                    createdAt: data.vaga.created_at,
                  };
                  setJobs((prev) => [createdJob, ...prev]);
                  handleSetSelectedJobId(createdJob.id);
                  handleSetActivePage("dashboard");
                  await refreshAppData();
                }}
                onUpdateJob={async (updatedJob) => {
                  const res = await fetch(`/api/vagas/${updatedJob.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: updatedJob.title,
                      area: updatedJob.department,
                      contract: updatedJob.contract,
                      location: updatedJob.location,
                      briefing: updatedJob.briefing,
                      status: updatedJob.status,
                    }),
                  });
                  const data = await res.json();

                  if (!res.ok) {
                    throw new Error(data.error || "Falha ao atualizar a vaga.");
                  }

                  setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
                  await refreshAppData();
                }}
                onOpenJob={(jobId) => {
                  handleSetSelectedJobId(jobId);
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <CandidateDrawer
        isOpen={Boolean(drawerCandidate)}
        onClose={handleCloseDrawer}
        candidate={drawerCandidate}
        onToggleShortlist={handleToggleShortlist}
        onMoveCandidate={handleMoveCandidateStatus}
        onUpdateCandidate={handleUpdateCandidate}
        quota={quota}
        onExportSuccess={() => {
          setQuota((prev) => {
            if (!prev) return null;
            if (prev.isAdmin || prev.limit === null) return prev;
            return {
              ...prev,
              used: prev.used + 1,
              remaining: prev.remaining !== null ? Math.max(0, prev.remaining - 1) : null,
            };
          });
        }}
      />
    </div>
  );
}
