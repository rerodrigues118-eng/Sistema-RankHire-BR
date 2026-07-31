"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PLANOS, getPlanoAtual } from "@/lib/planos";
import { CreditCard, ArrowRight, ShieldCheck, Check } from "lucide-react";

type EmpresaPlano = {
  id: string;
  nome: string;
  plano: string;
  subscription_status: string;
  current_period_end?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_price_id?: string | null;
  trial_expires_at: string;
};

export default function PlanosConfigPage() {
  const [empresa, setEmpresa] = useState<EmpresaPlano | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", user.id)
          .single();

        if (usuario?.empresa_id) {
          const { data: emp } = await supabase
            .from("empresas")
            .select("id, nome, plano, subscription_status, trial_expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, stripe_price_id")
            .eq("id", usuario.empresa_id)
            .single();
          if (emp) setEmpresa(emp as EmpresaPlano);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do plano:", error);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Check URL params for feedback (success/cancel from Stripe redirects)
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setFeedback({ type: "success", text: "Assinatura ativada ou alterada com sucesso! As alterações serão aplicadas em alguns instantes." });
    } else if (params.get("canceled") === "true") {
      setFeedback({ type: "error", text: "O checkout do Stripe foi cancelado." });
    }
  }, []);

  const handleCheckout = async (planKey: string) => {
    if (!empresa) return;
    const planConfig = PLANOS[planKey];
    if (!planConfig || !planConfig.stripe_price_id) {
      setFeedback({ type: "error", text: "Plano inválido ou ID do Stripe ausente." });
      return;
    }

    setSubmittingPlan(planKey);
    setFeedback(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planConfig.stripe_price_id }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao iniciar o checkout." });
      }
    } catch {
      setFeedback({ type: "error", text: "Falha de conexão ao criar sessão de checkout." });
    } finally {
      setSubmittingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!empresa || !empresa.stripe_customer_id) return;
    setLoadingPortal(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao redirecionar para o portal." });
      }
    } catch {
      setFeedback({ type: "error", text: "Falha de conexão ao acessar o portal do cliente." });
    } finally {
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white border rounded-xl shadow-sm">
        <p className="text-gray-500 font-medium">Empresa ou usuário não associado.</p>
        <p className="text-xs text-gray-400 mt-2">Por favor, conclua o onboarding.</p>
      </div>
    );
  }

  const statusAtual = getPlanoAtual(empresa);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plano e Faturamento</h1>
        <p className="text-gray-500 mt-2">Gerencie sua assinatura, formas de pagamento e consulte faturas via Stripe.</p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-5 py-4 text-sm flex items-start gap-3 shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="font-semibold">{feedback.type === "success" ? "✓" : "⚠"}</div>
          <p>{feedback.text}</p>
        </div>
      )}

      {/* PLANO ATUAL CARD */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status da Assinatura</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {PLANOS[empresa.plano]?.nome || empresa.plano}
            </h2>
            {statusAtual === "active" && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Ativo
              </span>
            )}
            {statusAtual === "trial" && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Período Trial (3 Dias)
              </span>
            )}
            {statusAtual === "expirado" && (
              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wide">
                Expirado
              </span>
            )}
          </div>
          {statusAtual === "trial" && (
            <p className="text-sm text-gray-500">
              Seu trial expira em:{" "}
              <span className="font-medium text-gray-700">
                {new Date(empresa.trial_expires_at).toLocaleDateString()}
              </span>
            </p>
          )}
          {statusAtual === "active" && empresa.current_period_end && (
            <p className="text-sm text-gray-500">
              Próxima renovação:{" "}
              <span className="font-medium text-gray-700">
                {new Date(empresa.current_period_end).toLocaleDateString()}
              </span>
            </p>
          )}
        </div>

        {empresa.stripe_customer_id && (
          <button
            onClick={handleManageBilling}
            disabled={loadingPortal}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPortal ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Gerenciar Assinatura &amp; Faturas
          </button>
        )}
      </div>

      {/* PLAN OPTIONS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Planos Disponíveis</h3>
          <p className="text-sm text-gray-500 mt-1">Selecione o plano ideal para a sua empresa e acelere suas triagens.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(PLANOS)
            .filter((key) => key !== "trial")
            .map((key) => {
              const plan = PLANOS[key];
              const isCurrent = empresa.plano === key && statusAtual === "active";

              return (
                <div
                  key={key}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative transition shadow-sm ${
                    isCurrent
                      ? "border-indigo-600 ring-1 ring-indigo-600"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {plan.destaque && (
                    <span className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-semibold uppercase tracking-wider">
                      Mais Popular
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{plan.nome}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-extrabold text-gray-900">R$ {plan.preco}</span>
                        <span className="text-sm text-gray-400 font-medium ml-1">/mês</span>
                      </div>
                    </div>

                    <ul className="space-y-3 pt-4 border-t border-gray-100 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.limite_vagas}</strong> vaga{plan.limite_vagas > 1 ? "s" : ""} ativa{plan.limite_vagas > 1 ? "s" : ""}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.limite_pdfs_mes}</strong> PDFs de currículos/mês</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Até <strong>{plan.limite_buscas_linkedin}</strong> buscas no LinkedIn/mês</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {plan.agente_ia_bloqueado ? "Sem suporte a Agentes de IA" : "Suporte completo a Agentes de IA"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-50">
                    {isCurrent ? (
                      <div className="w-full py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Plano Atual
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckout(key)}
                        disabled={submittingPlan !== null}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingPlan === key ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            Assinar Plano <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
