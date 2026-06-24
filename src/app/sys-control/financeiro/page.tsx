"use client";

import React from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, CreditCard, ExternalLink, TrendingUp } from "lucide-react";

export default function AdminFinanceiroPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827]">Financeiro e Assinaturas</h2>
          <p className="text-[#6B7280] text-[14px] mt-1">Visão detalhada da receita e assinaturas geridas via Stripe.</p>
        </div>
        <a 
          href="https://dashboard.stripe.com" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] hover:bg-[#544ee0] text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm w-fit"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Stripe Dashboard
        </a>
      </div>

      {/* Resumo do Mês (4 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm">
          <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">MRR Atual</p>
          <p className="text-[28px] font-bold text-[#111827] mt-2">R$ 14.850</p>
          <div className="flex items-center gap-1 text-emerald-600 text-[13px] font-medium mt-1">
            <ArrowUpRight className="w-4 h-4" /> +12.5% vs. Mês Anterior
          </div>
        </div>

        <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm">
          <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">Novos Pagantes (Mês)</p>
          <p className="text-[28px] font-bold text-[#111827] mt-2">8</p>
          <div className="flex items-center gap-1 text-emerald-600 text-[13px] font-medium mt-1">
            <ArrowUpRight className="w-4 h-4" /> Receita: +R$ 1.192
          </div>
        </div>

        <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm">
          <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">Upgrades (Mês)</p>
          <p className="text-[28px] font-bold text-[#111827] mt-2">3</p>
          <div className="flex items-center gap-1 text-emerald-600 text-[13px] font-medium mt-1">
            <ArrowUpRight className="w-4 h-4" /> Receita adicional: +R$ 450
          </div>
        </div>

        <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm">
          <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">Churn / Downsell</p>
          <p className="text-[28px] font-bold text-[#111827] mt-2">2</p>
          <div className="flex items-center gap-1 text-red-600 text-[13px] font-medium mt-1">
            <ArrowDownRight className="w-4 h-4" /> Receita perdida: -R$ 298
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Breakdown por Plano */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 border border-[#E5E7EB] rounded-xl shadow-sm">
            <h3 className="text-[16px] font-bold text-[#111827] mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#06D6A0]" /> Breakdown por Plano
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[14px] font-semibold text-[#374151]">Starter (R$ 149)</span>
                  <span className="text-[14px] font-bold text-[#111827]">R$ 4.470</span>
                </div>
                <div className="flex justify-between items-center text-[12px] text-[#6B7280]">
                  <span>30 clientes</span>
                  <span>30% do MRR</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[14px] font-semibold text-[#374151]">Pro (R$ 299)</span>
                  <span className="text-[14px] font-bold text-[#111827]">R$ 4.485</span>
                </div>
                <div className="flex justify-between items-center text-[12px] text-[#6B7280]">
                  <span>15 clientes</span>
                  <span>30% do MRR</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[14px] font-semibold text-[#374151]">Agência (R$ 599)</span>
                  <span className="text-[14px] font-bold text-[#111827]">R$ 5.895</span>
                </div>
                <div className="flex justify-between items-center text-[12px] text-[#6B7280]">
                  <span>10 clientes (Média/Personalizado)</span>
                  <span>40% do MRR</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 mt-2">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-bold text-[#6B7280] uppercase">Total MRR</span>
                <span className="text-[20px] font-bold text-[#059669]">R$ 14.850</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-[15px] font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#06D6A0]" /> Projeção de Conversão
            </h3>
            <p className="text-[13px] text-gray-300 mb-4">Se os 30 trials atuais converterem para o plano Starter neste mês, a receita adicional será:</p>
            <p className="text-[28px] font-bold text-[#06D6A0]">+ R$ 4.470,00</p>
            <p className="text-[12px] text-gray-400 mt-1">MRR Projetado: R$ 19.320,00</p>
          </div>
        </div>

        {/* Tabela de Assinaturas */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
            <h3 className="text-[16px] font-bold text-[#111827]">Últimos Pagamentos Processados</h3>
            <span className="text-[12px] font-medium text-[#6B7280]">Sincronizado há 5min</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-6 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Empresa</th>
                  <th className="px-6 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Plano / Valor</th>
                  <th className="px-6 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Data</th>
                  <th className="px-6 py-3 text-[12px] font-semibold text-[#6B7280] uppercase text-right">Status Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">RankHire Corp</td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-bold text-[#374151]">Starter</p>
                    <p className="text-[12px] text-[#6B7280]">R$ 149,00</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6B7280]">14 Jun 2026</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold uppercase">Pago</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">Alpha Group</td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-bold text-[#374151]">Pro</p>
                    <p className="text-[12px] text-[#6B7280]">R$ 299,00</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6B7280]">14 Jun 2026</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold uppercase">Pago</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">TechNova Solutions</td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-bold text-[#374151]">Agência</p>
                    <p className="text-[12px] text-[#6B7280]">R$ 599,00</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6B7280]">13 Jun 2026</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[11px] font-bold uppercase">Processando</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">Vanguard Tech</td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-bold text-[#374151]">Starter</p>
                    <p className="text-[12px] text-[#6B7280]">R$ 149,00</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#6B7280]">12 Jun 2026</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[11px] font-bold uppercase">Falhou</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] text-center">
            <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-[#635BFF] hover:underline">
              Ver histórico completo no Stripe →
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
