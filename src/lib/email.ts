type EmailParams = Record<string, unknown>;

export async function sendEmail(template: string, to: string, data: EmailParams) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    return false;
  }

  // Mapeamento de templates para IDs numéricos do Brevo
  const templateIds: Record<string, number> = {
    'boas_vindas': 1,
    'trial_meio': 2,
    'trial_expirando': 3,
    'trial_ultimo_dia': 4,
    'trial_expirado': 5,
    'upgrade_confirmado': 6,
    'pagamento_falhou': 7,
    'cancelamento_confirmado': 8,
  };

  const templateId = templateIds[template];

  if (!templateId) {
    return false;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        templateId: templateId,
        to: [{ email: to }],
        params: data,
      }),
    });

    if (!res.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
