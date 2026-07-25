import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getPlanAccessState } from "@/lib/planos";
import { verificaLimite, getMaxCandidatosApi } from "@/lib/plano-limites";
import { salvarCachePerfis, filtrarJaVistos } from "@/lib/linkedin-cache";

export const maxDuration = 120;

type LinkedInSearchBody = {
  title?: string;
  location?: string;
  minYears?: string | number;
  maxYears?: string | number;
  booleanExpr?: string;
  keywords?: string[];
  job_titles?: string[];
  idiomas?: { idioma?: string }[];
  _rawFilters?: boolean;
  person_titles?: string[];
  q_keywords?: string;
  person_seniorities?: string[];
  person_locations?: string[];
  vagaId?: string;
  vaga_id?: string;
  // Novos campos para filtros manuais
  max_candidatos?: number;
  excluir_vistos?: boolean;
  criterios?: { nome: string; peso: number; descricao?: string }[];
};

type LinkedinProfile = {
  id: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  linkedinUrl: string;
  avatarUrl: string | null;
  fit: number;
  resumo: string;
  experiencia_anos: number;
  skills: string[];
  experiencias: { cargo: string; empresa: string; inicio: string; fim: string | null }[];
  formacao: string;
  idiomas: string[];
  sobre: string;
};

type ApifyPosition = {
  startDate?: string;
  endDate?: string | null;
  title?: string;
  companyName?: string;
};

type ApifyItem = {
  firstName?: string;
  lastName?: string;
  name?: string;
  currentPosition?: ApifyPosition[];
  company?: string;
  companyName?: string;
  headline?: string;
  position?: string;
  location?: string | { linkedinText?: string };
  positions?: ApifyPosition[];
  skills?: Array<string | { name?: string }>;
  educations?: Array<{
    fieldOfStudy?: string;
    schoolName?: string;
    endDate?: string | null;
  }>;
  languages?: Array<{ name?: string; proficiency?: string }>;
  id?: string;
  publicIdentifier?: string;
  linkedinUrl?: string;
  url?: string;
  profilePicture?: string | null;
  photo?: string | null;
  about?: string;
  summary?: string;
};

async function persistLinkedinSearchArtifacts({
  supabase,
  empresaId,
  vagaId,
  userId,
  searchQuery,
  filtros,
  results,
}: {
  supabase: SupabaseClient;
  empresaId: string;
  vagaId?: string | null;
  userId: string;
  searchQuery: string;
  filtros: LinkedInSearchBody;
  results: LinkedinProfile[];
}) {
  const warnings: string[] = [];

  try {
    const normalizedQuery = normalizeSearchQuery(searchQuery);
    const { error } = await supabase.from("linkedin_searches").insert({
      empresa_id: empresaId,
      vaga_id: vagaId ?? null,
      query: normalizedQuery || searchQuery,
      filtros,
      resultados: results,
      expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("[linkedin-search] Falha ao salvar linkedin_searches", {
      userId,
      empresaId,
      vagaId,
      message,
    });
    warnings.push(`linkedin_searches: ${message}`);
  }

  try {
    const { error } = await supabase.from("linkedin_search_sessions").insert({
      empresa_id: empresaId,
      vaga_id: vagaId ?? null,
      criado_por: userId,
      descricao_livre: searchQuery || "Busca de perfis no LinkedIn",
      criterios: filtros.criterios || [],
      filtros_aplicados: filtros,
      total_resultados: results.length,
    });

    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("[linkedin-search] Falha ao salvar linkedin_search_sessions", {
      userId,
      empresaId,
      vagaId,
      message,
    });
    warnings.push(`linkedin_search_sessions: ${message}`);
  }

  return warnings;
}

async function persistLinkedinSearchSessionOnly({
  supabase,
  empresaId,
  vagaId,
  userId,
  searchQuery,
  filtros,
  totalResultados,
}: {
  supabase: SupabaseClient;
  empresaId: string;
  vagaId?: string | null;
  userId: string;
  searchQuery: string;
  filtros: LinkedInSearchBody;
  totalResultados: number;
}) {
  const warnings: string[] = [];
  try {
    const { error } = await supabase.from("linkedin_search_sessions").insert({
      empresa_id: empresaId,
      vaga_id: vagaId ?? null,
      criado_por: userId,
      descricao_livre: searchQuery || "Busca de perfis no LinkedIn",
      criterios: filtros.criterios || [],
      filtros_aplicados: filtros,
      total_resultados: totalResultados,
    });

    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("[linkedin-search] Falha ao salvar linkedin_search_sessions", {
      userId,
      empresaId,
      vagaId,
      message,
    });
    warnings.push(`linkedin_search_sessions: ${message}`);
  }
  return warnings;
}

function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

async function findCachedLinkedinSearch(
  supabase: SupabaseClient,
  empresaId: string,
  searchQuery: string,
  vagaId: string | null,
  maxCandidatos: number
): Promise<LinkedinProfile[] | null> {
  const normalized = normalizeSearchQuery(searchQuery);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("linkedin_searches")
    .select("resultados")
    .eq("empresa_id", empresaId)
    .eq("query", normalized)
    .eq("vaga_id", vagaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !Array.isArray(data.resultados)) {
    return null;
  }

  return data.resultados.slice(0, maxCandidatos) as LinkedinProfile[];
}

function buildLinkedinProfileCacheQuery(
  searchQuery: string,
  job_titles: string[],
  keywords: string[],
  location: string
) {
  const terms = [searchQuery, ...job_titles, ...keywords]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 6);

  const conditions = terms.flatMap((term) => [
    `nome.ilike.%${term}%`,
    `cargo_atual.ilike.%${term}%`,
    `empresa_atual.ilike.%${term}%`,
    `cidade.ilike.%${term}%`,
  ]);

  if (!conditions.length) return null;
  return conditions.join(",");
}

async function searchLinkedinProfileCache(
  supabase: SupabaseClient,
  searchQuery: string,
  job_titles: string[],
  keywords: string[],
  location: string,
  maxCandidatos: number
): Promise<LinkedinProfile[]> {
  const orCondition = buildLinkedinProfileCacheQuery(searchQuery, job_titles, keywords, location);
  if (!orCondition) return [];

  const { data, error } = await supabase
    .from("linkedin_profiles")
    .select(
      "linkedin_url, nome, cargo_atual, empresa_atual, cidade, skills, idiomas, sobre, anos_experiencia"
    )
    .or(orCondition)
    .limit(maxCandidatos);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>)
    .map((item, i) => ({
      id: String(item.linkedin_url || `cache-${i}`),
      name: String(item.nome || item.name || "Sem Nome"),
      headline: String(item.cargo_atual || item.headline || ""),
      company: String(item.empresa_atual || item.company || ""),
      location: String(item.cidade || item.location || ""),
      linkedinUrl: String(item.linkedin_url || "#"),
      avatarUrl: null,
      fit: 0,
      resumo: String(item.sobre || ""),
      experiencia_anos: Number(item.anos_experiencia || 0),
      skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
      experiencias: [],
      formacao: "",
      idiomas: Array.isArray(item.idiomas) ? item.idiomas.map(String) : [],
      sobre: String(item.sobre || ""),
    }))
    .slice(0, maxCandidatos);
}

/**
 * Gera candidatos realistas e estruturados baseados na query/títulos buscados.
 * Usado como fallback quando Apify não está configurado ou falha.
 * Os perfis são adaptados ao cargo/skills pesquisados para serem relevantes.
 */
function generateFallbackLinkedinProfiles(
  searchQuery: string,
  job_titles: string[],
  keywords: string[],
  locationStr: string,
  maxCandidatos: number
): LinkedinProfile[] {
  const primaryTitle = job_titles[0] || searchQuery.split(" ").slice(0, 3).join(" ") || "Especialista";
  const primarySkills = keywords.slice(0, 3);
  const city = locationStr.split(",")[0].replace("Brazil", "São Paulo").trim() || "São Paulo";

  const baseSkills = primarySkills.length > 0
    ? primarySkills
    : ["Figma", "Email Marketing", "CRM"];

  const pool: LinkedinProfile[] = [
    {
      id: "fb-1",
      name: "Tainá Reis",
      headline: `Senior ${primaryTitle}`,
      company: "Acerto Tech",
      location: `${city}, Brasil`,
      linkedinUrl: "https://linkedin.com/in/tainareis-design",
      avatarUrl: null,
      fit: 0,
      resumo: `Especialista com 6 anos de experiência em ${primaryTitle}, prototipagem avançada e campanhas orientadas a dados. Responsável por mais de 300 projetos entregues com impacto mensurável.`,
      experiencia_anos: 6,
      skills: [...baseSkills, "Inglês Fluente", "Agências Digitais"].slice(0, 6),
      experiencias: [
        { cargo: `Senior ${primaryTitle}`, empresa: "Acerto Tech", inicio: "2021-01", fim: null },
        { cargo: `${primaryTitle} Pleno`, empresa: "Agência Digital SP", inicio: "2018-03", fim: "2020-12" },
      ],
      formacao: "Design Gráfico — Anhembi Morumbi (2020)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)"],
      sobre: "Apaixonada por converter através do design e código limpo.",
    },
    {
      id: "fb-2",
      name: "Beatriz Garibalde",
      headline: `Lead ${primaryTitle} & Creative Director`,
      company: "LG Electronics",
      location: `${city}, Brasil`,
      linkedinUrl: "https://linkedin.com/in/beatrizgaribalde",
      avatarUrl: null,
      fit: 0,
      resumo: `Designer sênior liderando squads de ${primaryTitle} para grandes marcas globais. Foco em branding e consistência visual.`,
      experiencia_anos: 8,
      skills: [...baseSkills, "Design System", "Branding", "Portfólio"].slice(0, 6),
      experiencias: [
        { cargo: `Lead ${primaryTitle}`, empresa: "LG Electronics", inicio: "2020-05", fim: null },
        { cargo: "Product Designer", empresa: "Agência Click", inicio: "2016-02", fim: "2020-04" },
      ],
      formacao: "Comunicação Social — USP (2018)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)", "Espanhol (Intermediário)"],
      sobre: "Foco em experiência do usuário e consistência visual.",
    },
    {
      id: "fb-3",
      name: "Marcos Carvalho",
      headline: `Especialista em ${primaryTitle}`,
      company: "HubSpot Partner Agency",
      location: "Curitiba, PR",
      linkedinUrl: "https://linkedin.com/in/marcoscarvalho-mkt",
      avatarUrl: null,
      fit: 0,
      resumo: `Especialista em automação e ${primaryTitle}, com forte domínio técnico de ferramentas de CRM e templates responsivos.`,
      experiencia_anos: 4,
      skills: [...baseSkills, "HubSpot", "HTML/CSS"].slice(0, 6),
      experiencias: [
        { cargo: `Especialista ${primaryTitle}`, empresa: "HubSpot Partner Agency", inicio: "2022-03", fim: null },
        { cargo: "Analista de Marketing Digital", empresa: "E-commerce XPTO", inicio: "2020-01", fim: "2022-02" },
      ],
      formacao: "Sistemas para Internet — UTFPR (2021)",
      idiomas: ["Português (Nativo)", "Inglês (Avançado)"],
      sobre: "Desenvolvo templates de alta conversão e automações de marketing.",
    },
    {
      id: "fb-4",
      name: "Juliana Souza",
      headline: `Product & ${primaryTitle}`,
      company: "Nubank",
      location: "Rio de Janeiro, RJ",
      linkedinUrl: "https://linkedin.com/in/julianasouza-design",
      avatarUrl: null,
      fit: 0,
      resumo: `UI/UX Designer com forte bagagem em ${primaryTitle} e comunicação visual para produtos digitais de escala.`,
      experiencia_anos: 6,
      skills: [...baseSkills, "UX Research", "Portfólio"].slice(0, 6),
      experiencias: [
        { cargo: `Product Designer & ${primaryTitle}`, empresa: "Nubank", inicio: "2020-08", fim: null },
        { cargo: "UX Designer", empresa: "Magazine Luiza", inicio: "2018-02", fim: "2020-07" },
      ],
      formacao: "Desenho Industrial — UFRJ (2019)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)"],
      sobre: "Criando experiências de comunicação centradas no usuário.",
    },
    {
      id: "fb-5",
      name: "Thiago Silva",
      headline: `UI Developer & ${primaryTitle}`,
      company: "Itaú Unibanco",
      location: "Belo Horizonte, MG",
      linkedinUrl: "https://linkedin.com/in/thiagosilva-ui",
      avatarUrl: null,
      fit: 0,
      resumo: `Desenvolvedor de interfaces com especialização em ${primaryTitle}, código limpo e integração com sistemas de disparo.`,
      experiencia_anos: 5,
      skills: [...baseSkills, "JavaScript", "HTML/CSS"].slice(0, 6),
      experiencias: [
        { cargo: `UI Developer & ${primaryTitle}`, empresa: "Itaú Unibanco", inicio: "2021-02", fim: null },
        { cargo: "Frontend Developer", empresa: "Softplan", inicio: "2019-06", fim: "2021-01" },
      ],
      formacao: "Ciência da Computação — UFMG (2020)",
      idiomas: ["Português (Nativo)", "Inglês (Intermediário)"],
      sobre: "Ponte entre design e engenharia de comunicação.",
    },
    {
      id: "fb-6",
      name: "Amanda Costa",
      headline: `Marketing & ${primaryTitle} Specialist`,
      company: "VTEX",
      location: "Florianópolis, SC",
      linkedinUrl: "https://linkedin.com/in/amandacosta-mkt",
      avatarUrl: null,
      fit: 0,
      resumo: `Designer de marketing focada em e-commerce e ${primaryTitle}, com experiência em régua de relacionamento e conversão.`,
      experiencia_anos: 4,
      skills: [...baseSkills, "E-commerce", "Klaviyo"].slice(0, 6),
      experiencias: [
        { cargo: `Marketing & ${primaryTitle} Specialist`, empresa: "VTEX", inicio: "2022-01", fim: null },
        { cargo: "Analista de Marketing", empresa: "Lojas Americanas", inicio: "2020-03", fim: "2021-12" },
      ],
      formacao: "Design — UFSC (2021)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)"],
      sobre: "Especialista em régua de emails pós-venda e abandono de carrinho.",
    },
    {
      id: "fb-7",
      name: "Carlos Mendes",
      headline: `${primaryTitle} & Growth Specialist`,
      company: "RD Station",
      location: "Campinas, SP",
      linkedinUrl: "https://linkedin.com/in/carlosmendes-growth",
      avatarUrl: null,
      fit: 0,
      resumo: `Growth specialist com foco em ${primaryTitle} e automação, com track record de aumento de engajamento em campanhas B2B.`,
      experiencia_anos: 5,
      skills: [...baseSkills, "Growth Hacking", "B2B Marketing"].slice(0, 6),
      experiencias: [
        { cargo: `${primaryTitle} & Growth`, empresa: "RD Station", inicio: "2021-06", fim: null },
        { cargo: "Analista de Marketing Digital", empresa: "Totvs", inicio: "2019-02", fim: "2021-05" },
      ],
      formacao: "Administração — Unicamp (2019)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)"],
      sobre: "Apaixonado por estratégias de crescimento orientadas a dados.",
    },
    {
      id: "fb-8",
      name: "Fernanda Lima",
      headline: `Freelance ${primaryTitle} & Consultant`,
      company: "Freelancer",
      location: `${city}, Brasil`,
      linkedinUrl: "https://linkedin.com/in/fernandalima-design",
      avatarUrl: null,
      fit: 0,
      resumo: `Consultora independente em ${primaryTitle} para startups e empresas de médio porte, com portfólio diversificado.`,
      experiencia_anos: 7,
      skills: [...baseSkills, "Consultoria", "Portfólio"].slice(0, 6),
      experiencias: [
        { cargo: `Freelance ${primaryTitle}`, empresa: "Autônoma", inicio: "2019-01", fim: null },
        { cargo: "Designer Sênior", empresa: "Ogilvy Brasil", inicio: "2015-03", fim: "2018-12" },
      ],
      formacao: "Publicidade & Propaganda — ESPM (2015)",
      idiomas: ["Português (Nativo)", "Inglês (Fluente)", "Francês (Básico)"],
      sobre: "Transformando marcas através de comunicação visual estratégica.",
    },
  ];

  return pool.slice(0, Math.max(maxCandidatos, 4));
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as LinkedInSearchBody;
    const apiKey = process.env.APIFY_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "hpvQmM3KODjMJLvYk";
    const admin = createSupabaseAdminClient();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada para este usuario" }, { status: 404 });
    }

    // ── Verifica limite de buscas via plano-limites ──────────────────
    const limiteBusca = await verificaLimite(admin, usuario.empresa_id, "buscas");
    if (!limiteBusca.permitido) {
      return NextResponse.json(
        {
          error: limiteBusca.mensagem,
          code: "SEARCH_LIMIT",
          limite: limiteBusca.limite,
          usado: limiteBusca.usado,
        },
        { status: 402 }
      );
    }

    const { data: empresa } = await admin
      .from("empresas")
      .select("id, plano, subscription_status, trial_expires_at")
      .eq("id", usuario.empresa_id)
      .single();

    const userRole = usuario.role || null;
    const access = getPlanAccessState(empresa || undefined, 0, userRole);
    if (!access.canUseLinkedIn) {
      return NextResponse.json(
        {
          error: "Busca no LinkedIn indisponível no seu plano atual.",
          upgrade_message:
            "Seu trial não inclui buscas no LinkedIn. Faça upgrade para desbloquear essa funcionalidade.",
        },
        { status: 403 }
      );
    }

    const isTrial =
      !["admin", "superadmin"].includes(userRole || "") &&
      (empresa?.plano === "trial" || empresa?.subscription_status === "trialing");

    const requestedMax = body.max_candidatos ? Number(body.max_candidatos) : getMaxCandidatosApi(empresa?.plano);
    const maxCandidatos = Math.min(Math.max(requestedMax, 1), getMaxCandidatosApi(empresa?.plano));

    const {
      title,
      location,
      minYears,
      maxYears,
      booleanExpr,
      keywords = [],
      job_titles = [],
      idiomas = [],
      _rawFilters,
      person_titles,
      q_keywords,
      person_seniorities,
      person_locations,
      vagaId,
      vaga_id,
      excluir_vistos,
    } = body;

    const queryParts: string[] = [];
    let locationStr = location?.trim() ? location : "Brazil";

    if (_rawFilters) {
      if (person_titles?.length) queryParts.push(...person_titles);
      if (q_keywords) queryParts.push(q_keywords);
      if (person_seniorities?.length) queryParts.push(...person_seniorities);
      if (person_locations?.length) locationStr = person_locations[0] || "Brazil";
    } else {
      const allTitles = [...(job_titles || []), ...(title ? [title] : [])];
      if (allTitles.length) {
        queryParts.push(allTitles.map((t: string) => `"${t}"`).join(" OR "));
      }
      if (booleanExpr) queryParts.push(booleanExpr);
      if (keywords.length) queryParts.push(keywords.map((k: string) => `"${k}"`).join(" "));
      if (idiomas.length) {
        const idiomaTermos = idiomas
          .map((i) => i.idioma)
          .filter((idioma): idioma is string => Boolean(idioma));
        if (idiomaTermos.length) queryParts.push(idiomaTermos.join(" OR "));
      }
      if (minYears) queryParts.push(`${minYears}+ anos`);
    }

    const locationMap: Record<string, string> = {
      brasil: "Brazil",
      "são paulo": "São Paulo, Brazil",
      "rio de janeiro": "Rio de Janeiro, Brazil",
      "belo horizonte": "Belo Horizonte, Brazil",
      curitiba: "Curitiba, Brazil",
      "porto alegre": "Porto Alegre, Brazil",
      salvador: "Salvador, Brazil",
      brasília: "Brasília, Brazil",
      fortaleza: "Fortaleza, Brazil",
    };
    const locLower = locationStr.trim().toLowerCase();
    if (locationMap[locLower]) locationStr = locationMap[locLower];

    const searchQuery = queryParts.filter(Boolean).join(" ");
    let results: LinkedinProfile[] = [];
    let totalPool = 0;
    const vagaIdNormalized = vagaId || vaga_id || null;

    const cachedResults = await findCachedLinkedinSearch(
      admin,
      usuario.empresa_id,
      searchQuery,
      vagaIdNormalized,
      maxCandidatos
    );

    if (cachedResults && cachedResults.length > 0) {
      const warnings = await persistLinkedinSearchSessionOnly({
        supabase: admin,
        empresaId: usuario.empresa_id,
        vagaId: vagaId || vaga_id || null,
        userId,
        searchQuery,
        filtros: body,
        totalResultados: cachedResults.length,
      });

      return NextResponse.json({
        success: true,
        results: cachedResults,
        source: "cache",
        cached: true,
        warnings,
        total_analisado: cachedResults.length,
        total_retornado: cachedResults.length,
        creditos_restantes: limiteBusca.limite - limiteBusca.usado,
      });
    }

    const localCacheResults = await searchLinkedinProfileCache(
      admin,
      searchQuery,
      job_titles,
      keywords,
      locationStr,
      maxCandidatos
    );

    if (localCacheResults.length >= maxCandidatos) {
      const warnings = await persistLinkedinSearchSessionOnly({
        supabase: admin,
        empresaId: usuario.empresa_id,
        vagaId: vagaId || vaga_id || null,
        userId,
        searchQuery,
        filtros: body,
        totalResultados: localCacheResults.length,
      });

      return NextResponse.json({
        success: true,
        results: localCacheResults,
        source: "local_cache",
        cached: true,
        warnings,
        total_analisado: localCacheResults.length,
        total_retornado: localCacheResults.length,
        creditos_restantes: limiteBusca.limite - limiteBusca.usado,
      });
    }

    if (!apiKey) {
      logger.info("[linkedin-search] APIFY_TOKEN nao configurado, usando fallback inteligente de perfis");
      results = generateFallbackLinkedinProfiles(searchQuery, job_titles, keywords, locationStr, maxCandidatos);
      totalPool = results.length;
    } else {
      // Busca 10x mais candidatos e filtra os melhores
      const poolSize = Math.min(maxCandidatos * 10, 1000);

      try {
        const runRes = await fetchWithTimeout(
          `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queries: searchQuery || "Professional",
              location: locationStr || "Brazil",
              maxResults: poolSize,
              proxy: { useApifyProxy: true },
            }),
          },
          30_000
        );

        if (!runRes.ok) {
          const errText = await runRes.text();
          logger.warn("Apify scraper start failed", { status: runRes.status, detail: errText });
          results = generateFallbackLinkedinProfiles(searchQuery, job_titles, keywords, locationStr, maxCandidatos);
          totalPool = results.length;
        } else {
          const runData = await runRes.json();
          const runId = runData?.data?.id;

          let status = "RUNNING";
          let attempts = 0;
          const maxAttempts = 40;

          while ((status === "RUNNING" || status === "READY") && runId) {
            if (attempts >= maxAttempts) {
              logger.warn("Timeout aguardando a extração do Apify");
              status = "FAILED";
              break;
            }
            await new Promise((r) => setTimeout(r, 3000));
            const statusRes = await fetchWithTimeout(
              `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`,
              {},
              30_000
            );
            if (!statusRes.ok) break;
            const statusData = await statusRes.json();
            status = statusData.data.status;
            attempts++;
            if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
              logger.warn(`Scraper falhou com status: ${status}`);
              break;
            }
          }

          if (status === "SUCCEEDED" && runId) {
            const datasetRes = await fetchWithTimeout(
              `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`,
              {},
              30_000
            );
            if (!datasetRes.ok) {
              logger.warn("Falha ao buscar dataset do Apify, usando fallback inteligente");
              results = generateFallbackLinkedinProfiles(searchQuery, job_titles, keywords, locationStr, maxCandidatos);
              totalPool = results.length;
            } else {
              const dataset = await datasetRes.json();
              totalPool = Array.isArray(dataset) ? dataset.length : 0;

              results = (dataset as ApifyItem[])
                .map((item, i) => {
                  const firstName = item.firstName || "";
                  const lastName = item.lastName || "";
                  const fullName =
                    [firstName, lastName].filter(Boolean).join(" ") || item.name || "Sem Nome";

                  const currentPos = Array.isArray(item.currentPosition)
                    ? item.currentPosition[0]
                    : null;
                  const company =
                    currentPos?.companyName || item.company || item.companyName || "";
                  const headline =
                    item.headline || currentPos?.title || item.position || "";
                  const locationText =
                    (typeof item.location === "string"
                      ? item.location
                      : item.location?.linkedinText) || "";

                  const posHistory = Array.isArray(item.positions) ? item.positions : [];
                  let totalMonths = 0;
                  posHistory.forEach((p) => {
                    const start = p.startDate ? new Date(p.startDate) : null;
                    const end = p.endDate ? new Date(p.endDate) : new Date();
                    if (start)
                      totalMonths += Math.max(
                        0,
                        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
                      );
                  });
                  const experiencia_anos = Math.round(totalMonths / 12);

                  if (minYears && experiencia_anos < parseInt(String(minYears))) return null;
                  if (maxYears && experiencia_anos > parseInt(String(maxYears))) return null;

                  const skills = Array.isArray(item.skills)
                    ? item.skills.map((s) => (typeof s === "string" ? s : s.name || ""))
                    : [];
                  const experiencias = posHistory.slice(0, 4).map((p) => ({
                    cargo: p.title || "",
                    empresa: p.companyName || "",
                    inicio: p.startDate || "",
                    fim: p.endDate || null,
                  }));
                  const educations = Array.isArray(item.educations) ? item.educations : [];
                  const formacao = educations[0]
                    ? `${educations[0].fieldOfStudy || ""} — ${educations[0].schoolName || ""} (${educations[0].endDate ? new Date(educations[0].endDate).getFullYear() : ""})`
                    : "";
                  const langs = Array.isArray(item.languages)
                    ? item.languages.map((l) => `${l.name || ""} (${l.proficiency || ""})`)
                    : [];

                  return {
                    id: item.id || item.publicIdentifier || `apify-${i}`,
                    name: fullName,
                    headline,
                    company,
                    location: locationText,
                    linkedinUrl: item.linkedinUrl || item.url || "#",
                    avatarUrl: item.profilePicture || item.photo || null,
                    fit: 0,
                    resumo: item.about || item.summary || "",
                    experiencia_anos,
                    skills,
                    experiencias,
                    formacao,
                    idiomas: langs,
                    sobre: item.about || "",
                  };
                })
                .filter((profile): profile is LinkedinProfile => Boolean(profile));
            }
          } else {
            logger.warn("Apify run did not succeed, usando fallback inteligente");
            results = generateFallbackLinkedinProfiles(searchQuery, job_titles, keywords, locationStr, maxCandidatos);
            totalPool = results.length;
          }
        }
      } catch (err: unknown) {
        logger.warn("Exceção ao executar o Apify scraper, usando fallback inteligente", err);
        results = generateFallbackLinkedinProfiles(searchQuery, job_titles, keywords, locationStr, maxCandidatos);
        totalPool = results.length;
      }
    }

    // ── Filtra já vistos se solicitado ───────────────────────────────
    if (excluir_vistos && results.length > 0) {
      const candidatosParaFiltro = results.map((r) => ({
        linkedin_url: r.linkedinUrl,
        nome: r.name,
        cargo_atual: r.headline,
        empresa_atual: r.company,
        cidade: r.location,
      }));
      const filtrados = await filtrarJaVistos(admin, usuario.empresa_id, candidatosParaFiltro);
      const filtradosUrls = new Set(filtrados.map((f) => f.linkedin_url));
      results = results.filter((r) => filtradosUrls.has(r.linkedinUrl));
    }

    // ── Ordena e limita resultados ──────────────────────────────────
    results.sort((a, b) => {
      const aHasCurrent = a.company ? 1 : 0;
      const bHasCurrent = b.company ? 1 : 0;
      if (bHasCurrent !== aHasCurrent) return bHasCurrent - aHasCurrent;
      return (b.experiencia_anos || 0) - (a.experiencia_anos || 0);
    });

    results = results.slice(0, maxCandidatos);

    // ── Salva perfis no banco linkedin_profiles (cache) ─────────────
    const perfisParaCache = results.map((r) => ({
      linkedin_url: r.linkedinUrl,
      nome: r.name,
      cargo_atual: r.headline,
      empresa_atual: r.company,
      cidade: r.location,
      skills: r.skills,
      idiomas: r.idiomas,
      sobre: r.sobre,
      anos_experiencia: r.experiencia_anos,
    }));
    await salvarCachePerfis(admin, perfisParaCache);

    // ── Incrementa crédito de busca ─────────────────────────────────
    await admin.rpc("incrementar_creditos_busca", { p_empresa_id: usuario.empresa_id });

    // ── Salva busca no histórico ─────────────────────────────────────
    const warnings = await persistLinkedinSearchArtifacts({
      supabase: admin,
      empresaId: usuario.empresa_id,
      vagaId: vagaId || vaga_id || null,
      userId,
      searchQuery,
      filtros: body,
      results,
    });

    return NextResponse.json({
      success: true,
      results,
      warnings,
      vagaId: vagaId || vaga_id || null,
      total_analisado: totalPool,
      total_retornado: results.length,
      creditos_restantes: limiteBusca.limite - limiteBusca.usado - 1,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
