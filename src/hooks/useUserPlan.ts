"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStripeCheckoutUrl } from "@/lib/constants/stripe";

export type UserPlanKey = "trial" | "starter" | "pro" | "agencia" | "free" | "expirado";

export interface UserPlanState {
  plan: UserPlanKey;
  rawPlanName: string;
  subscriptionStatus: string;
  isActive: boolean;
  isTrial: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  userEmail: string | null;
  userId: string | null;
  empresaId: string | null;
  loading: boolean;
  canAccessFeature: (feature: "pdf_ranker" | "linkedin_search" | "agente_ia" | "analytics" | "crm_candidates") => boolean;
  getCheckoutUrl: (planKey: string) => string;
}

export function useUserPlan(): UserPlanState {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [rawPlanName, setRawPlanName] = useState<string>("trial");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("trialing");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (active) setLoading(false);
          return;
        }

        if (active) {
          setUserEmail(user.email || null);
          setUserId(user.id);
        }

        // Fetch usuario and empresa
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("empresa_id")
          .eq("id", user.id)
          .single();

        if (usuario?.empresa_id) {
          if (active) setEmpresaId(usuario.empresa_id);

          const { data: empresa } = await supabase
            .from("empresas")
            .select("plano, subscription_status, stripe_customer_id, stripe_subscription_id, trial_expires_at")
            .eq("id", usuario.empresa_id)
            .single();

          if (empresa && active) {
            setRawPlanName(empresa.plano || "trial");
            setSubscriptionStatus(empresa.subscription_status || "trialing");
            setStripeCustomerId(empresa.stripe_customer_id || null);
            setStripeSubscriptionId(empresa.stripe_subscription_id || null);
            setTrialExpiresAt(empresa.trial_expires_at || null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar plano do usuário:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      active = false;
    };
  }, []);

  const normalized = (rawPlanName || "").toLowerCase();
  let plan: UserPlanKey = "free";

  if (subscriptionStatus === "active") {
    if (normalized.includes("pro") || normalized.includes("growth")) plan = "pro";
    else if (normalized.includes("agencia") || normalized.includes("business") || normalized.includes("enterprise")) plan = "agencia";
    else if (normalized.includes("starter") || normalized.includes("profissional")) plan = "starter";
    else plan = "starter";
  } else if (normalized.includes("trial")) {
    const expired = trialExpiresAt ? new Date(trialExpiresAt) < new Date() : false;
    plan = expired ? "expirado" : "trial";
  } else {
    plan = "free";
  }

  const isActive = subscriptionStatus === "active" || (plan === "trial" && subscriptionStatus === "trialing");
  const isTrial = plan === "trial";

  const canAccessFeature = useCallback(
    (feature: "pdf_ranker" | "linkedin_search" | "agente_ia" | "analytics" | "crm_candidates") => {
      const currentPlan = plan as UserPlanKey;
      if (currentPlan === "expirado") return false;
      if (currentPlan === "agencia" || currentPlan === "pro") return true;

      switch (feature) {
        case "pdf_ranker":
        case "linkedin_search":
          return true;
        case "crm_candidates":
        case "analytics":
          return currentPlan === "starter";
        case "agente_ia":
          return false;
        default:
          return true;
      }
    },
    [plan]
  );

  const getCheckoutUrl = useCallback(
    (planKey: string) => {
      return getStripeCheckoutUrl(planKey, {
        email: userEmail,
        userId: userId,
        empresaId: empresaId,
      });
    },
    [userEmail, userId, empresaId]
  );

  return {
    plan,
    rawPlanName,
    subscriptionStatus,
    isActive,
    isTrial,
    stripeCustomerId,
    stripeSubscriptionId,
    userEmail,
    userId,
    empresaId,
    loading,
    canAccessFeature,
    getCheckoutUrl,
  };
}
