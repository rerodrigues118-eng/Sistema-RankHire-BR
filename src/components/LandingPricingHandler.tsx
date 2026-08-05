"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStripeCheckoutUrl } from "@/lib/constants/stripe";

export default function LandingPricingHandler() {
  useEffect(() => {
    async function initStripeLinks() {
      let email: string | null = null;
      let userId: string | null = null;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          email = user.email || null;
          userId = user.id;
        }
      } catch {
        /* unauthenticated */
      }

      const handleClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest("a, button");
        if (!target) return;

        const href = (target.getAttribute("href") || "").toLowerCase();
        const text = (target.textContent || "").toLowerCase();
        const dataPlan = (target.getAttribute("data-plan") || "").toLowerCase();

        let planKey: string | null = null;

        if (dataPlan === "starter" || href.includes("starter") || text.includes("starter")) {
          planKey = "starter";
        } else if (dataPlan === "pro" || href.includes("pro") || href.includes("growth") || text.includes("pro") || text.includes("growth")) {
          planKey = "pro";
        } else if (dataPlan === "agencia" || href.includes("agencia") || href.includes("business") || text.includes("agência") || text.includes("agencia") || text.includes("enterprise")) {
          planKey = "agencia";
        }

        if (planKey) {
          e.preventDefault();
          const url = getStripeCheckoutUrl(planKey, { email, userId });
          window.location.href = url;
        }
      };

      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }

    initStripeLinks();
  }, []);

  return null;
}
