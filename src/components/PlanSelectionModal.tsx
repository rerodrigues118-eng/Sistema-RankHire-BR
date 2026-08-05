"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, ArrowRight, Sparkles, Users, CheckCircle2, ShieldCheck } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planKey: string, checkoutUrl?: string) => void;
}

export default function PlanSelectionModal({
  isOpen,
  onClose,
  onSelectPlan,
}: PlanSelectionModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [growthSeats, setGrowthSeats] = useState<number>(1);
  const { plan: userPlan, isActive, getCheckoutUrl } = useUserPlan();

  if (!isOpen) return null;

  const isCurrentPlan = (planKey: string) => {
    if (!isActive) return false;
    if (planKey === "starter" && userPlan === "starter") return true;
    if (planKey === "pro" && userPlan === "pro") return true;
    if (planKey === "agencia" && userPlan === "agencia") return true;
    return false;
  };

  const handleSelect = (planKey: string) => {
    if (isCurrentPlan(planKey)) return;
    const checkoutUrl = getCheckoutUrl(planKey);

    if (onSelectPlan) {
      onSelectPlan(planKey, checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Billing Cycle Toggle */}
          <div className="flex flex-col items-center justify-center mb-8 pt-2">
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Anual
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Economize 15%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* 1. Starter Plan */}
            <div
              className={`flex flex-col rounded-2xl border p-6 transition-all relative ${
                isCurrentPlan("starter")
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 ring-2 ring-blue-600/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {isCurrentPlan("starter") && (
                <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Seu Plano
                </span>
              )}

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Starter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                Plano autosserviço com buscas ilimitadas, ideal para recrutadores autônomos.
              </p>

              <div className="mt-4 mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    R$ {billingCycle === "yearly" ? "84" : "99"}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ mês</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {billingCycle === "yearly" ? "(faturado anualmente)" : "(faturado mensalmente)"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-6 py-2 border-b border-slate-100 dark:border-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Inclui 1 assento (seat)</span>
              </div>

              <div className="flex-1 space-y-2.5 mb-6 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-3">
                  Tudo no Gratuito, e mais:
                </p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Buscas e perfis ilimitados</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>500 créditos de contato (e-mail + telefone)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>500 créditos de exportação</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Modelos de e-mail com IA</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrentPlan("starter")}
                onClick={() => handleSelect("starter")}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  isCurrentPlan("starter")
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                {isCurrentPlan("starter") ? "Plano Atual" : <>Escolher Plano Starter <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>

            {/* 2. Growth Plan */}
            <div
              className={`flex flex-col rounded-2xl border p-6 transition-all relative ${
                isCurrentPlan("pro")
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 ring-2 ring-blue-600/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {isCurrentPlan("pro") && (
                <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Seu Plano
                </span>
              )}

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Growth</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                Colaborativo, feito para pequenas equipes, agências e startups.
              </p>

              <div className="mt-4 mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    R$ {billingCycle === "yearly" ? "152" : "179"}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ mês</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {billingCycle === "yearly" ? "(faturado anualmente)" : "(faturado mensalmente)"}
                </span>
              </div>

              {/* Dynamic Seats Control */}
              <div className="mb-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Número de assentos</span>
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800">
                    <button
                      type="button"
                      disabled={growthSeats <= 1}
                      onClick={() => setGrowthSeats((s) => Math.max(1, s - 1))}
                      className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-30 px-1 font-bold"
                    >
                      –
                    </button>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 w-4 text-center">
                      {growthSeats}
                    </span>
                    <button
                      type="button"
                      disabled={growthSeats >= 5}
                      onClick={() => setGrowthSeats((s) => Math.min(5, s + 1))}
                      className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-30 px-1 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Adicione até 5 assentos (pago por assento)</span>
              </div>

              <div className="flex-1 space-y-2.5 mb-6 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-3">
                  Tudo do Starter, e mais:
                </p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Insights avançados de talentos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>1.500 créditos de contato (e-mail + telefone)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>1.500 créditos de exportação</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Integração com até 3 caixas de e-mail por usuário</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrentPlan("pro")}
                onClick={() => handleSelect("pro")}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  isCurrentPlan("pro")
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                }`}
              >
                {isCurrentPlan("pro") ? "Plano Atual" : <>Escolher Plano Growth <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>

            {/* 3. Business / Enterprise Plan (Featured) */}
            <div
              className={`flex flex-col rounded-2xl border-2 p-6 relative shadow-xl ${
                isCurrentPlan("agencia")
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-600/30"
                  : "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-blue-500/10"
              }`}
            >
              <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                {isCurrentPlan("agencia") ? <><CheckCircle2 className="w-3 h-3" /> Seu Plano</> : "Mais Recomendado"}
              </span>

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Business</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                Acesso completo para grandes empresas, RHs corporativos e agências.
              </p>

              <div className="mt-4 mb-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  Sob Consulta
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Fale com nossos especialistas
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-6 py-2 border-b border-blue-100 dark:border-blue-900/60">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">Assentos ilimitados</span>
              </div>

              <div className="flex-1 space-y-2.5 mb-6 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-3">
                  Tudo do Growth, e mais:
                </p>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Analytics e BI de recrutamento</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Múltiplos gestores de vagas (Hiring Managers)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Sourcing em redes externas e ATS/CRM integrations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Créditos de contato ilimitados</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Gerente de Sucesso (CS) dedicado</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrentPlan("agencia")}
                onClick={() => handleSelect("agencia")}
                className={`w-full py-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  isCurrentPlan("agencia")
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                }`}
              >
                {isCurrentPlan("agencia") ? "Plano Atual" : <>Solicitar Demonstração <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
