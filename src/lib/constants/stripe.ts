export const STRIPE_CHECKOUT_URLS = {
  starter: "https://buy.stripe.com/test_14A9AUgj5bo50sgcUT1ZS03",
  pro: "https://buy.stripe.com/test_5kQ4gA1obgIpa2Q5sr1ZS01",
  agencia: "https://buy.stripe.com/test_3cI4gA4An4ZHa2Q1cb1ZS02",
} as const;

export type StripePlanKey = keyof typeof STRIPE_CHECKOUT_URLS;

export interface GetCheckoutUrlOptions {
  email?: string | null;
  userId?: string | null;
  empresaId?: string | null;
}

/**
 * Retorna a URL de checkout do Stripe com prefilled_email e client_reference_id se fornecidos.
 */
export function getStripeCheckoutUrl(
  planKey: string,
  options?: GetCheckoutUrlOptions
): string {
  const normalizedKey = (planKey || "").toLowerCase();
  
  let baseUrl: string;
  if (normalizedKey.includes("pro") || normalizedKey.includes("growth")) {
    baseUrl = STRIPE_CHECKOUT_URLS.pro;
  } else if (normalizedKey.includes("agencia") || normalizedKey.includes("business") || normalizedKey.includes("enterprise")) {
    baseUrl = STRIPE_CHECKOUT_URLS.agencia;
  } else {
    baseUrl = STRIPE_CHECKOUT_URLS.starter;
  }

  const url = new URL(baseUrl);

  if (options?.email) {
    url.searchParams.set("prefilled_email", options.email);
  }

  const refId = options?.empresaId || options?.userId;
  if (refId) {
    url.searchParams.set("client_reference_id", refId);
  }

  return url.toString();
}
