"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';
import { getPlanoAtual, type EmpresaSimples } from '@/lib/planos';

export default function TrialBanner() {
  const [empresa, setEmpresa] = useState<EmpresaSimples | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/empresas', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.empresa) setEmpresa(data.empresa as EmpresaSimples);
      } catch {
        // non-fatal
      }
    }
    load();
  }, []);

  if (!empresa) return null;

  const status = getPlanoAtual(empresa);

  if (status === 'expirado' || empresa.subscription_status === 'canceled') {
    return (
      <div className="bg-red-50 text-red-800 px-6 py-3 flex items-center justify-between border-b border-red-200">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-[14px]">Seu trial encerrou. Assine para continuar usando o RankHire BR</span>
        </div>
        <Link href="/configuracoes/plano" className="px-4 py-1.5 bg-red-600 text-white font-medium text-[13px] rounded hover:bg-red-700 transition">
          Ver planos
        </Link>
      </div>
    );
  }

  if (status === 'trial') {
    const trialExpires = new Date(empresa.trial_expires_at);
    const diasRestantes = Math.max(0, Math.ceil((trialExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    
    if (diasRestantes <= 7) {
      return (
        <div className="bg-amber-50 text-amber-900 px-6 py-3 flex items-center justify-between border-b border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-[14px]">⚠️ Seu trial expira em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}! Não perca seus dados — escolha um plano</span>
          </div>
          <Link href="/configuracoes/plano" className="px-4 py-1.5 bg-amber-600 text-white font-medium text-[13px] rounded hover:bg-amber-700 transition">
            Assinar agora →
          </Link>
        </div>
      );
    } else {
      return (
        <div className="bg-yellow-50 text-yellow-800 px-6 py-3 flex items-center justify-between border-b border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[14px]">⚡ Você está no trial gratuito — {diasRestantes} dias restantes</span>
          </div>
          <Link href="/configuracoes/plano" className="text-yellow-700 hover:text-yellow-900 font-medium text-[13px] underline">
            Fazer upgrade para continuar após o período
          </Link>
        </div>
      );
    }
  }

  if (empresa.subscription_status === 'past_due') {
    return (
      <div className="bg-red-50 text-red-800 px-6 py-3 flex items-center justify-between border-b border-red-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-[14px]">⚠️ Problema com seu pagamento — atualize para manter o acesso</span>
        </div>
        <Link href="/configuracoes/plano" className="px-4 py-1.5 bg-red-600 text-white font-medium text-[13px] rounded hover:bg-red-700 transition">
          Atualizar pagamento →
        </Link>
      </div>
    );
  }

  return null;
}
