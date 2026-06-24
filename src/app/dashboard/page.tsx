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
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [processedCount] = useState(12);
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

  const handleOpenDrawer = useCallback((candidate: Candidate) => setDrawerCandidate(candidate), []);
  const handleCloseDrawer = useCallback(() => setDrawerCandidate(null), []);
  const handleUpdateCandidate = useCallback((updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAppData() {
      setIsBootstrapping(true);
      setBootstrapError(null);

      try {
        const res = await fetch("/api/app-data");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Falha ao carregar os dados do app.");
        }

        if (!alive) return;

        if (Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          setSelectedJobId(data.jobs[0]?.id || "");
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
        if (alive) {
          setBootstrapError(error instanceof Error ? error.message : "Falha ao carregar os dados do app.");
        }
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
  }, []);

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

  const handleNewUpload = useCallback(() => {
    setActivePage("pdf-ranker");
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

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

      // Polling fallback: checks for completed candidates every 3s
      const pendingPaths = new Set(storagePaths);
      const pollTimer = setInterval(async () => {
        if (pendingPaths.size === 0) {
          clearInterval(pollTimer);
          return;
        }
        try {
          const batchRes = await fetch(`/api/batches/${batchData.batch_id}`);
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
        } catch {
          // ignore polling errors
        }
      }, 3000);

      // Cleanup timer after 5 minutes
      setTimeout(() => clearInterval(pollTimer), 300_000);

      e.target.value = "";
    },
    [activeJob, uploads.length]
  );

  function addCandidateFromData(candData: any, batchData: any) {
    const actualScore = candData.score_final ?? candData.score;
    if (actualScore == null) return;

    const candMeta = batchData.candidates?.find((c: any) => c.id === candData.id);
    if (!candMeta) return;

    const fallbackBasename =
      candMeta.file_url.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") || "Candidato";
    const parts = fallbackBasename.split(" ").filter(Boolean);
    const fallbackName =
      parts.length >= 2
        ? `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`
        : fallbackBasename;

    const finalName = candData.nome_candidato || fallbackName;
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newCand: Candidate = {
      id: candData.id,
      name: finalName,
      role: activeJob?.title || "Vaga selecionada",
      company: "Via upload",
      city: "São Paulo, SP",
      score: actualScore,
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
      status: "triado",
      linkedinUrl: "#",
      createdAt: new Date().toISOString(),
    };

    setCandidates((prev) => {
      if (prev.some((c) => c.id === newCand.id)) return prev;
      return [newCand, ...prev];
    });

    setUploads((prev) => {
      const pending = prev.filter((u) => u.status !== "completed" && u.status !== "failed");
      if (pending.length === 0) setIsUploading(false);
      return prev;
    });
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            activeJob={activeJob}
            jobs={jobs}
            candidates={candidates}
            onToggleShortlist={handleToggleShortlist}
            onSelectCandidate={handleOpenDrawer}
          />
        );
      case "pdf-ranker":
        if (!activeJob) {
          return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
              Crie ou selecione uma vaga para usar o PDF Ranker.
            </div>
          );
        }
        return (
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
        );
      case "linkedin":
        if (!activeJob) {
          return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
              Crie ou selecione uma vaga para buscar candidatos no LinkedIn.
            </div>
          );
        }
        return <LinkedinPage activeJob={activeJob} onImportCandidate={handleImportCandidate} />;
      case "pipeline":
        return (
          <PipelinePage
            candidates={candidates}
            onMoveCandidate={handleMoveCandidateStatus}
            onResetPipeline={handleResetPipeline}
            onSelectCandidate={handleOpenDrawer}
          />
        );
      case "analytics":
        return <AnalyticsPage jobs={jobs} candidates={candidates} quota={quota} />;
      case "settings":
        return <SettingsPage />;
      case "vagas":
        return (
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
              const createdJob: Job = data.vaga
                ? {
                    ...newJob,
                    id: data.vaga.id,
                    createdDate: new Date(data.vaga.created_at).toLocaleDateString("pt-BR"),
                    createdAt: data.vaga.created_at,
                  }
                : { ...newJob, createdAt: new Date().toISOString() };
              setJobs((prev) => [createdJob, ...prev]);
            }}
            onUpdateJob={async (updatedJob) => {
              await fetch(`/api/vagas/${updatedJob.id}`, {
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
              setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
            }}
            onOpenJob={(jobId) => {
              setSelectedJobId(jobId);
              setActivePage("dashboard");
            }}
          />
        );
      case "agente-ia":
        return <AgenteIAPage />;
      case "candidatos":
        return <CandidatosPage candidates={candidates} onSelectCandidate={handleOpenDrawer} />;
      default:
        return null;
    }
  };

  if (isBootstrapping) {
    return (
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
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
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--bg-base)]">
        <main className="flex-1 overflow-y-auto p-6 text-[var(--text-primary)]">
          {bootstrapError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {bootstrapError}
            </div>
          )}
          <div className="w-full">{renderPage()}</div>
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
