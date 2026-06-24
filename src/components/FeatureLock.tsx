"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureLockProps {
  isLocked: boolean;
  children: React.ReactNode;
  featureName?: string;
}

export default function FeatureLock({ isLocked, children, featureName = "funcionalidade" }: FeatureLockProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative w-full h-full group">
      <div className="pointer-events-none opacity-40 blur-[2px] transition-all duration-300">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm text-center border border-gray-100 transform transition-transform group-hover:scale-105">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-900 mb-2">Upgrade Necessário</h3>
          <p className="text-[13px] text-gray-500 mb-6">
            A {featureName} está disponível apenas nos planos pagos. Faça o upgrade para desbloquear.
          </p>
          <Link 
            href="/configuracoes/plano" 
            className="w-full bg-indigo-600 text-white font-medium text-[14px] py-2.5 rounded-lg hover:bg-indigo-700 transition"
          >
            Ver Planos
          </Link>
        </div>
      </div>
    </div>
  );
}
