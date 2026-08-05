"use client";

import React, { useState, useEffect } from "react";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ExternalLink, Loader2, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import PlanSelectionModal from "@/components/PlanSelectionModal";

export default function PlanosConfigPage() {
  const { plan: userPlan, isActive, stripeCustomerId, loading, getCheckoutUrl } = useUserPlan();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setFeedback({ type: "success", text: "Assinatura ativada ou alterada com sucesso! As alterações serão aplicadas em alguns instantes." });
    } else if (params.get("canceled") === "true") {
      setFeedback({ type: "error", text: "O checkout do Stripe foi cancelado." });
    }
  }, []);

  const handleSelectPlan = (planKey: string, checkoutUrl?: string) => {
    const targetUrl = checkoutUrl || getCheckoutUrl(planKey);
    window.location.href = targetUrl;
  };

  const handleManageBilling = async () => {
    if (!stripeCustomerId) {
      setIsPlanModalOpen(true);
      return;
    }
    setLoadingPortal(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao abrir o portal de cobrança do Stripe." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro de conexão com o portal do Stripe." });
    } finally {
      setLoadingPortal(false);
    }
  };

  const getPlanoTitle = () => {
    if (userPlan === "pro") return "Plano Growth / Pro";
    if (userPlan === "agencia") return "Plano Business / Enterprise";
    if (userPlan === "starter") return "Plano Starter";
    if (userPlan === "trial") return "Trial Gratuito";
    if (userPlan === "expirado") return "Trial Expirado";
    return "Plano Pro"; // Default fallback para visualização
  };

  const getPlanoPrice = () => {
    if (userPlan === "starter") return "R$ 149,00 /mês";
    if (userPlan === "agencia") return "R$ 599,00 /mês";
    return "R$ 299,00 /mês";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Plano e cobrança
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gerencie seu plano atual, métodos de pagamento e histórico de faturas.
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-medium ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Seção 1: PLANO ATUAL */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            PLANO ATUAL
          </h2>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {getPlanoTitle()}
                </h3>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ATIVO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Seu plano renova automaticamente ao final de cada período de faturamento.{" "}
                <a
                  href="#saiba-mais"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPlanModalOpen(true);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Saiba mais <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={loadingPortal}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition disabled:opacity-60"
              >
                {loadingPortal ? "Carregando..." : "Gerenciar Assinatura"}
              </button>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Alterar plano
              </button>
            </div>
          </div>
        </section>

        {/* Seção 2: HISTÓRICO DE COBRANÇA */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              HISTÓRICO DE COBRANÇA
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">PLANO</th>
                  <th className="px-6 py-3.5">VALOR</th>
                  <th className="px-6 py-3.5">DATA</th>
                  <th className="px-6 py-3.5">STATUS DO PAGAMENTO</th>
                  <th className="px-6 py-3.5 text-right">RECIBO / NF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {isActive || userPlan === "pro" || userPlan === "starter" || userPlan === "agencia" ? (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {userPlan === "pro" ? "Plano Pro" : getPlanoTitle()}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {getPlanoPrice()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      01/08/2026
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Pago
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={handleManageBilling}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Baixar Recibo <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nenhum histórico de cobrança encontrado. Apenas administradores da organização têm acesso a esta seção.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção 3: NOTIFICAÇÕES */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            NOTIFICAÇÕES
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Notificações de faturamento por e-mail
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Enviaremos um e-mail com a fatura e o recibo sempre que um pagamento for processado. Para alterar o e-mail da conta de pagamento, use o botão Gerenciar Assinatura acima.
              </p>
            </div>

            {/* UI Switch Toggle em Azul Royal */}
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailNotifications ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSelectPlan={handleSelectPlan}
      />
    </main>
  );
}
