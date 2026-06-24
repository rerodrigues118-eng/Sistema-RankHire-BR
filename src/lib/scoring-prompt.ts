export interface Criteria {
  name: string;
  weight: number; // 1 to 5
}

export function buildScoringPrompt(cvText: string, criteria: Criteria[]): string {
  const criteriaList = criteria
    .map((c) => `- ${c.name} (peso:${c.weight})`)
    .join("\n");

  return `Analise o currículo abaixo e retorne SOMENTE um JSON válido (sem markdown).

CRITÉRIOS (avalie cada um de 1.0 a 5.0):
${criteriaList}

CURRÍCULO:
${cvText}

REGRAS:
- score_final = média ponderada: soma(nota*peso)/soma(pesos)
- Se critério não mencionado: nota=1.0, justificativa="Não mencionado no currículo"
- Todos os campos ausentes: null (exceto disponibilidade → "A combinar", nome → "Candidato sem nome")

JSON de saída:
{"nome":"...","email":null,"telefone":null,"linkedin":null,"cidade":null,"cargo_atual":null,"empresa_atual":null,"pretensao_salarial":null,"disponibilidade":"A combinar","regime_preferido":null,"resumo":"...","score_final":0.0,"criterios":[{"nome":"...","nota":0.0,"justificativa":"..."}]}`;
}
