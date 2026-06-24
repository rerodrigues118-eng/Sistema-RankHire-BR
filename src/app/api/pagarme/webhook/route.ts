import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { NextResponse } from "next/server";

type PagarmeEvent = {
  type?: string;
  data?: {
    id?: string;
    customer?: unknown;
    current_period?: {
      start_at?: string;
      end_at?: string;
    };
    metadata?: {
      empresa_id?: string;
    };
  };
};

function signaturesMatch(signature: string | null, expectedSignature: string) {
  if (!signature) return false;

  const received = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-pagarme-signature");
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

    if (!signaturesMatch(signature, expectedSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as PagarmeEvent;
    const supabase = createSupabaseAdminClient();

    const getEmpresaDetails = async (pagarmeSubId: string) => {
      const { data } = await supabase
        .from("empresas")
        .select("id,admin_email,nome")
        .eq("pagarme_subscription_id", pagarmeSubId)
        .single();
      return data;
    };

    switch (event.type) {
      case "subscription.created": {
        if (event.data?.id) {
          const emp = await getEmpresaDetails(event.data.id);
          if (emp?.admin_email) await sendEmail("upgrade_confirmado", emp.admin_email, { nome: emp.nome });
        }
        break;
      }

      case "subscription.renewed": {
        const subscription = event.data;
        if (subscription?.id && subscription.current_period?.end_at) {
          await supabase
            .from("empresas")
            .update({
              subscription_status: "active",
              current_period_start: subscription.current_period.start_at
                ? new Date(subscription.current_period.start_at).toISOString()
                : undefined,
              current_period_end: new Date(subscription.current_period.end_at).toISOString(),
            })
            .eq("pagarme_subscription_id", subscription.id);

          const emp = await getEmpresaDetails(subscription.id);
          if (emp?.admin_email) await sendEmail("upgrade_confirmado", emp.admin_email, { nome: emp.nome });
        }
        break;
      }

      case "subscription.payment_failed": {
        if (event.data?.id) {
          await supabase
            .from("empresas")
            .update({ subscription_status: "past_due" })
            .eq("pagarme_subscription_id", event.data.id);

          const emp = await getEmpresaDetails(event.data.id);
          if (emp?.admin_email) await sendEmail("pagamento_falhou", emp.admin_email, { nome: emp.nome });
        }
        break;
      }

      case "subscription.canceled": {
        if (event.data?.id) {
          await supabase
            .from("empresas")
            .update({ subscription_status: "canceled" })
            .eq("pagarme_subscription_id", event.data.id);

          const emp = await getEmpresaDetails(event.data.id);
          if (emp?.admin_email) await sendEmail("cancelamento_confirmado", emp.admin_email, { nome: emp.nome });
        }
        break;
      }

      case "charge.paid": {
        const empresaId = event.data?.metadata?.empresa_id;
        if (empresaId) {
          await supabase.from("empresas").update({ subscription_status: "active" }).eq("id", empresaId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return handleApiError(error, "Webhook handler failed");
  }
}
