import type { AgentCriterion, AgentFilterSet } from "@/lib/types";
import type { createSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

type CriteriaRow = {
  vaga_id: string;
  nome: string | null;
  peso: number | null;
  descricao?: string | null;
  description?: string | null;
};

export async function loadCriteriaByVagaIds(
  admin: AdminClient,
  vagaIds: string[],
): Promise<Map<string, AgentCriterion[]>> {
  const map = new Map<string, AgentCriterion[]>();
  if (vagaIds.length === 0) return map;

  const { data } = await admin
    .from("criteria")
    .select("vaga_id,nome,peso,descricao,description")
    .in("vaga_id", vagaIds);

  for (const row of data || []) {
    const list = map.get(row.vaga_id) || [];
    list.push({
      nome: row.nome || row.description || "Critério",
      peso: row.peso ?? 3,
      descricao: row.descricao || row.description || undefined,
    });
    map.set(row.vaga_id, list);
  }

  return map;
}

export function deriveFiltersFromBriefing(briefing?: string | null, vagaTitulo?: string | null): AgentFilterSet {
  const title = vagaTitulo || "vaga";
  const text = (briefing || "").toLowerCase();
  return {
    job_titles: [title],
    localizacao: text.includes("remoto") ? "Remoto" : "Brasil",
    experiencia_minima: text.includes("senior") ? 5 : text.includes("pleno") ? 3 : 2,
    experiencia_maxima: text.includes("senior") ? 12 : 8,
    keywords: Array.from(
      new Set(
        [title, ...(briefing || "").split(/[,.;\n]/g)]
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6),
      ),
    ),
  };
}
