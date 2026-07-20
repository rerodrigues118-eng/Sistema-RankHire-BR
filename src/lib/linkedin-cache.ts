import type { SupabaseClient } from "@supabase/supabase-js";

export type LinkedinProfileData = {
  linkedin_url: string;
  nome?: string | null;
  cargo_atual?: string | null;
  empresa_atual?: string | null;
  cidade?: string | null;
  skills?: string[];
  idiomas?: string[];
  formacao?: unknown[];
  experiencias?: unknown[];
  sobre?: string | null;
  anos_experiencia?: number | null;
  dados_completos?: unknown;
};

/**
 * Salva ou atualiza perfis do LinkedIn na tabela linkedin_profiles.
 * Usa upsert com conflict em linkedin_url para evitar duplicatas.
 * Chamado pela busca inteligente e pelo worker de enriquecimento.
 */
export async function salvarCachePerfis(
  supabase: SupabaseClient,
  candidatos: LinkedinProfileData[]
): Promise<{ salvos: number; erros: string[] }> {
  const erros: string[] = [];

  const perfis = candidatos
    .filter((c) => c.linkedin_url && c.linkedin_url !== "#")
    .map((c) => ({
      linkedin_url: c.linkedin_url,
      nome: c.nome || null,
      cargo_atual: c.cargo_atual || null,
      empresa_atual: c.empresa_atual || null,
      cidade: c.cidade || null,
      skills: c.skills || [],
      idiomas: c.idiomas || [],
      formacao: c.formacao || [],
      experiencias: c.experiencias || [],
      sobre: c.sobre || null,
      anos_experiencia: c.anos_experiencia || null,
      dados_completos: c.dados_completos || c,
      ultima_atualizacao: new Date().toISOString(),
      fonte: "apify",
    }));

  if (!perfis.length) {
    return { salvos: 0, erros: ["Nenhum perfil com linkedin_url válido"] };
  }

  // Processa em lotes de 50 para evitar timeout
  let salvos = 0;
  for (let i = 0; i < perfis.length; i += 50) {
    const lote = perfis.slice(i, i + 50);
    const { error } = await supabase
      .from("linkedin_profiles")
      .upsert(lote, { onConflict: "linkedin_url" });

    if (error) {
      erros.push(`Lote ${i / 50 + 1}: ${error.message}`);
    } else {
      salvos += lote.length;
    }
  }

  return { salvos, erros };
}

/**
 * Busca perfis já cacheados por URL do LinkedIn.
 */
export async function buscarPerfisCacheados(
  supabase: SupabaseClient,
  urls: string[]
): Promise<Map<string, LinkedinProfileData>> {
  const mapa = new Map<string, LinkedinProfileData>();

  if (!urls.length) return mapa;

  const { data } = await supabase
    .from("linkedin_profiles")
    .select("*")
    .in("linkedin_url", urls);

  if (data) {
    for (const perfil of data) {
      mapa.set(perfil.linkedin_url, perfil as unknown as LinkedinProfileData);
    }
  }

  return mapa;
}

/**
 * Filtra candidatos já vistos pela empresa (tabela perfis_vistos).
 */
export async function filtrarJaVistos(
  supabase: SupabaseClient,
  empresaId: string,
  candidatos: LinkedinProfileData[]
): Promise<LinkedinProfileData[]> {
  const urls = candidatos.map((c) => c.linkedin_url).filter(Boolean);

  if (!urls.length) return candidatos;

  const { data: vistos } = await supabase
    .from("perfis_vistos")
    .select("linkedin_url")
    .eq("empresa_id", empresaId)
    .in("linkedin_url", urls);

  const vistosSet = new Set((vistos || []).map((v) => v.linkedin_url));

  return candidatos.filter((c) => !vistosSet.has(c.linkedin_url));
}
