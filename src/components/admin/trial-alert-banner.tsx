"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Clock } from "lucide-react";
import Link from "next/link";

type TrialAlert = {
  id: string;
  empresa: string;
  dias_restantes: number;
};

export default function TrialAlertBanner() {
  const [trials, setTrials] = useState<TrialAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchTrials() {
      try {
        const res = await fetch('/api/admin/trials');
        if (res.ok) {
          const data = await res.json();
          // Só mostra alertas com ≤ 3 dias
          const urgentes = (data.trials || []).filter((t: TrialAlert) => t.dias_restantes <= 3);
          setTrials(urgentes);
        }
      } catch {}
    }
    fetchTrials();
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchTrials, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed || trials.length === 0) return null;

  return (
    <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between gap-4 text-[13px]">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold">
          🚨 {trials.length} {trials.length === 1 ? "empresa expira" : "empresas expiram"} em menos de 3 dias:
        </span>
        <span className="flex gap-2 flex-wrap">
          {trials.map(t => (
            <span key={t.id} className="bg-red-500/50 rounded px-2 py-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t.empresa} ({t.dias_restantes}d)
            </span>
          ))}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/sys-control/trials" className="underline text-white/90 hover:text-white font-semibold">
          Ver Trials →
        </Link>
        <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
