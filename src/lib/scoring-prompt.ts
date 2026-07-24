export interface Criteria {
  id?: string;
  name: string;
  weight: number; // 1 to 5
}

function stripAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildScoringPrompt(cvText: string, criteria: Criteria[]): string {
  const criteriaList = criteria
    .map((c, i) => `${i + 1}. "${c.name}" (peso:${c.weight})`)
    .join("\n");

  const jsonTemplate = criteria.map((c) => ({
    nome: c.name,
    nota: 3.0,
    justificativa: "Explicação objetiva da nota para este critério"
  }));

  return `Você é um avaliador especialista em recrutamento e seleção.
Analise o currículo fornecido e avalie a aderência do candidato a CADA UM dos critérios da vaga.

CRITÉRIOS DA VAGA (Peso 1=baixo, 5=essencial):
${criteriaList}

CURRÍCULO DO CANDIDATO:
${cvText}

REGRAS RIGOROSAS DE AVALIAÇÃO:
1. Avalie CADA critério atribuindo uma nota de 1.0 (baixa aderência/não mencionado) a 5.0 (excelente aderência).
2. Na lista "criterios" do JSON, você DEVE retornar TODOS os critérios listados acima, mantendo EXATAMENTE o mesmo nome do critério.
3. Se um critério não for mencionado no currículo, atribua nota 1.0 e justificativa "Não mencionado no currículo".
4. Extraia os dados pessoais e profissionais do candidato.
5. Retorne APENAS um JSON válido no formato especificado, sem formatação markdown ou texto extra.

FORMATO JSON DE SAÍDA:
{
  "nome": "Nome completo do candidato",
  "email": null,
  "telefone": null,
  "linkedin": null,
  "cidade": null,
  "cargo_atual": null,
  "empresa_atual": null,
  "pretensao_salarial": null,
  "disponibilidade": "A combinar",
  "regime_preferido": null,
  "resumo": "Resumo objetivo do perfil do candidato em 2 linhas",
  "criterios": ${JSON.stringify(jsonTemplate, null, 2)}
}`;
}

export interface RawAiCriterion {
  nome?: string;
  name?: string;
  criterio?: string;
  nota?: number | string;
  score?: number | string;
  note?: number | string;
  justificativa?: string;
  justification?: string;
  observacao?: string;
}

export interface MatchedEvaluation {
  criteria_id: string;
  nome: string;
  nota: number;
  justificativa: string;
}

export function matchCriteriaAndCalculateScore(
  formattedCriteria: Array<{ id: string; name: string; weight: number }>,
  rawCriterios: RawAiCriterion[]
): { scoreFinal: number; evaluations: MatchedEvaluation[] } {
  if (!formattedCriteria || formattedCriteria.length === 0) {
    return { scoreFinal: 3.0, evaluations: [] };
  }

  let sumWeightedScores = 0;
  let sumWeights = 0;

  const usedRawIndices = new Set<number>();
  const evaluations: MatchedEvaluation[] = [];

  formattedCriteria.forEach((dbCrit, idx) => {
    let matchedRawIndex = -1;

    // 1. Match exato de string
    matchedRawIndex = rawCriterios.findIndex(
      (r, i) => !usedRawIndices.has(i) && (r.nome || r.name || r.criterio) === dbCrit.name
    );

    // 2. Match normalizado (sem acentos e minúsculas)
    if (matchedRawIndex === -1) {
      const dbNorm = stripAccents(dbCrit.name);
      matchedRawIndex = rawCriterios.findIndex((r, i) => {
        if (usedRawIndices.has(i)) return false;
        const rName = stripAccents(String(r.nome || r.name || r.criterio || ""));
        return rName === dbNorm;
      });
    }

    // 3. Match por inclusão/subtring
    if (matchedRawIndex === -1) {
      const dbNorm = stripAccents(dbCrit.name);
      matchedRawIndex = rawCriterios.findIndex((r, i) => {
        if (usedRawIndices.has(i)) return false;
        const rName = stripAccents(String(r.nome || r.name || r.criterio || ""));
        return rName.length > 2 && (rName.includes(dbNorm) || dbNorm.includes(rName));
      });
    }

    // 4. Match por posição ordinal se a IA retornou exatamente a mesma quantidade de itens
    if (matchedRawIndex === -1 && rawCriterios.length === formattedCriteria.length && rawCriterios[idx]) {
      if (!usedRawIndices.has(idx)) {
        matchedRawIndex = idx;
      }
    }

    let nota = 1.0;
    let justificativa = "Não mencionado no currículo";

    if (matchedRawIndex !== -1 && rawCriterios[matchedRawIndex]) {
      usedRawIndices.add(matchedRawIndex);
      const raw = rawCriterios[matchedRawIndex];
      const parsedNota = Number(raw.nota ?? raw.score ?? raw.note);
      nota = !isNaN(parsedNota) ? Math.max(1.0, Math.min(5.0, parsedNota)) : 1.0;
      justificativa = String(raw.justificativa || raw.justification || raw.observacao || "Avaliado pela IA");
    }

    evaluations.push({
      criteria_id: dbCrit.id,
      nome: dbCrit.name,
      nota,
      justificativa,
    });

    sumWeightedScores += nota * dbCrit.weight;
    sumWeights += dbCrit.weight;
  });

  const scoreFinal = sumWeights > 0
    ? Math.round((sumWeightedScores / sumWeights) * 10) / 10
    : 3.0;

  return {
    scoreFinal: Math.max(1.0, Math.min(5.0, scoreFinal)),
    evaluations,
  };
}

