import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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
      .select("id, nome, admin_email, stripe_customer_id")
      .eq("id", usuario.empresa_id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    const { planId } = (await req.json()) as { planId?: string };

    if (!planId) {
      return NextResponse.json({ error: "ID do plano é obrigatório." }, { status: 400 });
    }

    const pStarter = process.env.STRIPE_PRICE_STARTER || "price_starter_mock";
    const pPro = process.env.STRIPE_PRICE_PRO || "price_pro_mock";
    const pAgencia = process.env.STRIPE_PRICE_AGENCIA || "price_agencia_mock";

    const allowedPrices = [pStarter, pPro, pAgencia];
    if (!allowedPrices.includes(planId)) {
      return NextResponse.json({ error: "Plano inválido ou não suportado." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: empresa.id,
      success_url: `${appUrl}/configuracoes/plano?success=true`,
      cancel_url: `${appUrl}/configuracoes/plano?canceled=true`,
    };

    if (empresa.stripe_customer_id) {
      sessionParams.customer = empresa.stripe_customer_id;
    } else if (empresa.admin_email) {
      sessionParams.customer_email = empresa.admin_email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to create checkout session");
  }
}
