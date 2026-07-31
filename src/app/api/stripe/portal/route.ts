import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId, supabase } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada para este usuário." }, { status: 404 });
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("stripe_customer_id")
      .eq("id", usuario.empresa_id)
      .single();

    if (!empresa || !empresa.stripe_customer_id) {
      return NextResponse.json({ error: "Você não possui uma assinatura ou cliente ativo no Stripe." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: empresa.stripe_customer_id,
      return_url: `${appUrl}/configuracoes/plano`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to create portal session");
  }
}
