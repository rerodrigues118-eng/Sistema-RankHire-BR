import { fetchWithTimeout } from "./api";

export async function callAI(
  prompt: string,
  systemPrompt?: string,
  modelId?: string
): Promise<string> {
  const messages: { role: string; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const maxRetries = 3;
  let attempt = 0;

  const model = modelId || process.env.GROQ_MODEL_SCORING || 'llama-3.1-8b-instant';

  while (attempt < maxRetries) {
    try {
      const response = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          }),
        },
        60_000,
      );

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || '10';
        console.warn(`[AI] Rate limited (429), retry after ${retryAfter}s`);
        await new Promise((r) => setTimeout(r, parseInt(retryAfter) * 1000));
        attempt++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq ${response.status}: ${errorText.slice(0, 300)}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: unknown) {
      attempt++;
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[AI] Tentativa ${attempt}/${maxRetries} falhou: ${msg}`);
      if (attempt >= maxRetries) {
        throw new Error(`Groq API falhou: ${msg}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error('Groq API falhou após 3 tentativas');
}
