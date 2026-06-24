"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminTopbar() {
  return (
    <div className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
      
      <div className="flex items-center gap-4">
        <h1 className="text-[16px] font-semibold text-[#111827]">
          Painel Administrativo RankHire BR
        </h1>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded text-[11px] font-bold uppercase tracking-widest border border-red-100">
          <Shield className="w-3 h-3" />
          Modo Admin
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-[14px] font-medium text-gray-700 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao sistema
        </Link>
      </div>

    </div>
  );
}
