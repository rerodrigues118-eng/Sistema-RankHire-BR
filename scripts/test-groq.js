require("dotenv").config();

async function run() {
  console.log("=== GROQ TEST ===");
  const model = process.env.GROQ_MODEL_SCORING || 'llama-3.1-8b-instant';
  console.log("Using model:", model);
  console.log("API Key exists:", !!process.env.GROQ_API_KEY);

  const messages = [
    { role: 'system', content: 'You are a hiring assistant. Return a JSON object with keys "score_final" (number 1-5) and "criterios" (array of criteria with keys "nome", "nota", "justificativa").' },
    { role: 'user', content: 'Rate this candidate for Python Developer role. Candidate has 5 years of Python experience, Django, FastAPI. Criteria: 1. Experiencia Python (weight 5), 2. Inglês (weight 3).' }
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (error) {
    console.error("Error calling Groq:", error);
  }
}

run();
