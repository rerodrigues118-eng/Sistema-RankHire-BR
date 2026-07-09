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

export async function sendVerificationEmail(to: string, code: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('[sendVerificationEmail] BREVO_API_KEY is missing');
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
        sender: { email: 'produtostecnologia3@gmail.com', name: 'RankHire BR' },
        to: [{ email: to }],
        subject: 'Seu código de verificação - RankHire',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Bem-vindo ao RankHire BR</h2>
            <p style="color: #555; font-size: 16px;">Para continuar seu cadastro, por favor, utilize o código de verificação abaixo:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <strong style="font-size: 24px; color: #1a56db; letter-spacing: 5px;">${code}</strong>
            </div>
            <p style="color: #777; font-size: 14px; text-align: center;">Este código é válido por 10 minutos. Se você não solicitou este código, ignore este e-mail.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('[sendVerificationEmail] Brevo API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[sendVerificationEmail] Fetch error:', error);
    return false;
  }
}
