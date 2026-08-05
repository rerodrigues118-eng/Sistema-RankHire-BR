import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing stripe-signature or webhook secret" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const getEmpresaDetails = async (stripeSubId: string) => {
      const { data } = await supabase
        .from("empresas")
        .select("id,admin_email,nome")
        .eq("stripe_subscription_id", stripeSubId)
        .maybeSingle();
      return data;
    };

    const getEmpresaDetailsById = async (empresaId: string) => {
      const { data } = await supabase
        .from("empresas")
        .select("id,admin_email,nome")
        .eq("id", empresaId)
        .maybeSingle();
      return data;
    };

    const getPlanoLimits = (priceId: string) => {
      let planoNome = "trial";
      let pdfLimit = 15;
      let buscasLimit = 3;
      let vagasLimit = 1;

      const pStarter = process.env.STRIPE_PRICE_STARTER || "price_starter_mock";
      const pPro = process.env.STRIPE_PRICE_PRO || "price_pro_mock";
      const pAgencia = process.env.STRIPE_PRICE_AGENCIA || "price_agencia_mock";

      if (priceId === pStarter) {
        planoNome = "starter";
        pdfLimit = 100;
        buscasLimit = 50;
        vagasLimit = 5;
      } else if (priceId === pPro) {
        planoNome = "pro";
        pdfLimit = 500;
        buscasLimit = 200;
        vagasLimit = 999;
      } else if (priceId === pAgencia) {
        planoNome = "agencia";
        pdfLimit = 9999;
        buscasLimit = 9999;
        vagasLimit = 999;
      }

      return { planoNome, pdfLimit, buscasLimit, vagasLimit };
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        let empresaId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const customerEmail = session.customer_details?.email || session.customer_email;

        // If client_reference_id is a usuario id, find their empresa_id
        if (empresaId) {
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("empresa_id")
            .eq("id", empresaId)
            .single();
          if (usuario?.empresa_id) {
            empresaId = usuario.empresa_id;
          }
        }

        // Fallback: lookup by customer email if client_reference_id is missing or not found
        if (!empresaId && customerEmail) {
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("empresa_id")
            .eq("email", customerEmail)
            .single();
          if (usuario?.empresa_id) {
            empresaId = usuario.empresa_id;
          }
        }

        if (empresaId && subscriptionId) {
          const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
          const priceId = subscription.items.data[0].price.id;
          const { planoNome, pdfLimit, buscasLimit, vagasLimit } = getPlanoLimits(priceId);

          await supabase
            .from("empresas")
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plano: planoNome,
              subscription_status: "active",
              limite_pdfs_mes: pdfLimit,
              limite_buscas_linkedin: buscasLimit,
              limite_vagas: vagasLimit,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", empresaId);

          const emp = await getEmpresaDetailsById(empresaId);
          if (emp?.admin_email) {
            await sendEmail("upgrade_confirmado", emp.admin_email, { nome: emp.nome });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const priceId = subscription.items.data[0].price.id;
        const { planoNome, pdfLimit, buscasLimit, vagasLimit } = getPlanoLimits(priceId);

        await supabase
          .from("empresas")
          .update({
            stripe_price_id: priceId,
            plano: planoNome,
            subscription_status: subscription.status,
            limite_pdfs_mes: pdfLimit,
            limite_buscas_linkedin: buscasLimit,
            limite_vagas: vagasLimit,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (subscription.status === "past_due" || subscription.status === "unpaid") {
          const emp = await getEmpresaDetails(subscription.id);
          if (emp?.admin_email) {
            await sendEmail("pagamento_falhou", emp.admin_email, { nome: emp.nome });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        await supabase
          .from("empresas")
          .update({
            subscription_status: "canceled",
            plano: "trial",
            limite_pdfs_mes: 15,
            limite_buscas_linkedin: 3,
            limite_vagas: 1,
          })
          .eq("stripe_subscription_id", subscription.id);

        const emp = await getEmpresaDetails(subscription.id);
        if (emp?.admin_email) {
          await sendEmail("cancelamento_confirmado", emp.admin_email, { nome: emp.nome });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from("empresas")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);

          const emp = await getEmpresaDetails(subscriptionId);
          if (emp?.admin_email) {
            await sendEmail("pagamento_falhou", emp.admin_email, { nome: emp.nome });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return handleApiError(error, "Stripe Webhook handler failed");
  }
}
