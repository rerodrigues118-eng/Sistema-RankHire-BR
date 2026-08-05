"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Lock, Sparkles, ArrowRight } from "lucide-react";
import { getPlanoAtual, type EmpresaSimples } from "@/lib/planos";

export default function TrialBanner() {
  const [empresa, setEmpresa] = useState<EmpresaSimples | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/empresas", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.empresa) setEmpresa(data.empresa as EmpresaSimples);
      } catch {
        /* non-fatal */
      }
    }
    load();
  }, []);

  if (!empresa) return null;

  const role = (empresa.role || "").trim().toLowerCase();
  if (role === "superadmin") return null;

  const status = getPlanoAtual(empresa);

  if (status === "expirado" || empresa.subscription_status === "canceled") {
    return (
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2.5 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <Lock className="w-4 h-4 text-white shrink-0" />
          <span>Seu período de teste expirou. Assine um plano para liberar todas as funções do RankHire BR.</span>
        </div>
        <Link
          href="/configuracoes/plano"
          className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 shrink-0"
        >
          Ver planos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === "trial") {
    const trialExpires = new Date(empresa.trial_expires_at);
    const diasRestantes = Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    if (diasRestantes <= 3) {
      return (
        <div className="bg-amber-500 text-slate-950 px-6 py-2 flex items-center justify-between shadow-xs z-20 font-medium text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              Seu período de teste expira em <strong>{diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}</strong>! Assine um plano para continuar navegando.
            </span>
          </div>
          <Link
            href="/configuracoes/plano"
            className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-800 font-bold rounded-lg transition shrink-0"
          >
            Escolher Plano
          </Link>
        </div>
      );
    }
  }

  return null;
}
