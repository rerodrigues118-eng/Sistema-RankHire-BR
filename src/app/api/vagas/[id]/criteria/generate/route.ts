import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { titulo_vaga, briefing } = body;

    if (!titulo_vaga) return NextResponse.json({ error: "titulo_vaga obrigatório" }, { status: 400 });

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        criteria: [
          { nome: "Experiência na área", peso: 5, descricao: "Anos de experiência relevante para a vaga" },
          { nome: "Habilidades técnicas", peso: 4, descricao: "Domínio das ferramentas e tecnologias necessárias" },
          { nome: "Formação acadêmica", peso: 3, descricao: "Graduação ou certificações relevantes" },
          { nome: "Idiomas", peso: 2, descricao: "Proficiência em idiomas necessários para a vaga" },
          { nome: "Conquistas e resultados", peso: 4, descricao: "Resultados mensuráveis em experiências anteriores" },
        ],
        fonte: "padrao",
      });
    }

    const prompt = `Você é um especialista em recrutamento.
Crie 5 critérios de avaliação para a vaga: "${titulo_vaga}"
${briefing ? `\nBriefing: ${briefing}` : ""}

Retorne APENAS este JSON (sem markdown):
{
  "criterios": [
    {
      "nome": "Nome curto do critério",
      "peso": 5,
      "descricao": "O que será avaliado neste critério"
    }
  ]
}

Regras:
- peso de 1 a 5 (5 = mais importante)
- nomes curtos (máximo 4 palavras)
- descrições diretas e objetivas
- critérios específicos para "${titulo_vaga}"`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL_CRITERIA || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Retorne APENAS JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.error("[generate criteria] Groq error:", res.status);
      return NextResponse.json({
        criteria: [
          { nome: "Experiência na área", peso: 5, descricao: `Experiência em ${titulo_vaga}` },
          { nome: "Habilidades técnicas", peso: 4, descricao: "Ferramentas e tecnologias da vaga" },
          { nome: "Formação", peso: 3, descricao: "Formação acadêmica relevante" },
          { nome: "Resultados comprovados", peso: 4, descricao: "Conquistas mensuráveis" },
          { nome: "Fit cultural", peso: 2, descricao: "Alinhamento com a cultura da empresa" },
        ],
        fonte: "padrao_fallback",
      });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      criteria: parsed.criterios.map((c: any) => ({
        nome: c.nome,
        peso: Math.max(1, Math.min(5, Number(c.peso) || 3)),
        descricao: c.descricao,
        gerado_por_ia: true,
      })),
      fonte: "ia",
    });
  } catch (err) {
    console.error("[generate criteria] crash:", err);
    return NextResponse.json({
      criteria: [
        { nome: "Experiência", peso: 5, descricao: "Experiência relevante para a vaga" },
        { nome: "Habilidades", peso: 4, descricao: "Habilidades técnicas necessárias" },
        { nome: "Formação", peso: 3, descricao: "Formação acadêmica" },
        { nome: "Resultados", peso: 4, descricao: "Resultados comprovados" },
        { nome: "Idiomas", peso: 2, descricao: "Proficiência em idiomas" },
      ],
      fonte: "erro_fallback",
    });
  }
}
