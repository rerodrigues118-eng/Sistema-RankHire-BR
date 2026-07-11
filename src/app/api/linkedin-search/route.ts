import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchWithTimeout, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getPlanAccessState } from "@/lib/planos";

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
  supabase: any;
  empresaId: string;
  vagaId?: string | null;
  userId: string;
  searchQuery: string;
  filtros: LinkedInSearchBody;
  results: LinkedinProfile[];
}) {
  const warnings: string[] = [];

  try {
    const { error } = await supabase.from("linkedin_searches").insert({
      empresa_id: empresaId,
      vaga_id: vagaId ?? null,
      query: searchQuery,
      filtros,
      resultados: results,
      expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("[linkedin-search] Falha ao salvar linkedin_searches", { userId, empresaId, vagaId, message });
    warnings.push(`linkedin_searches: ${message}`);
  }

  try {
    const { error } = await supabase.from("linkedin_search_sessions").insert({
      empresa_id: empresaId,
      vaga_id: vagaId ?? null,
      criado_por: userId,
      descricao_livre: searchQuery || "Busca de perfis no LinkedIn",
      criterios: [],
      filtros_aplicados: filtros,
      total_resultados: results.length,
    });

    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    logger.error("[linkedin-search] Falha ao salvar linkedin_search_sessions", { userId, empresaId, vagaId, message });
    warnings.push(`linkedin_search_sessions: ${message}`);
  }

  return warnings;
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await req.json()) as LinkedInSearchBody;
    const apiKey = process.env.APIFY_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "hpvQmM3KODjMJLvYk";
    // admin-client: justificado — persistência de buscas e sessões que exige service-role
    const admin = createSupabaseAdminClient();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada para este usuario" }, { status: 404 });
    }

    const { data: empresa } = await admin
      .from("empresas")
      .select("id, plano, subscription_status, trial_expires_at")
      .eq("id", usuario.empresa_id)
      .single();

    const access = getPlanAccessState(empresa || undefined, 0);
    if (!access.canUseLinkedIn) {
      return NextResponse.json({
        error: "Busca no LinkedIn indisponível no seu plano atual.",
        upgrade_message: "Seu trial não inclui buscas no LinkedIn. Faça upgrade para desbloquear essa funcionalidade.",
      }, { status: 403 });
    }

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
    } = body;

    const queryParts: string[] = [];
    let locationStr = "Brazil";

    if (_rawFilters) {
      if (person_titles?.length) queryParts.push(...person_titles);
      if (q_keywords) queryParts.push(q_keywords);
      if (person_seniorities?.length) queryParts.push(...person_seniorities);
      if (person_locations?.length) locationStr = person_locations[0] || "Brazil";
    } else {
      const allTitles = [...(job_titles || []), ...(title ? [title] : [])];
      if (allTitles.length) {
        queryParts.push(allTitles.map((t: string) => `"${t}"`).join(' OR '));
      }
      if (booleanExpr) queryParts.push(booleanExpr);
      if (keywords.length) queryParts.push(keywords.map((k: string) => `"${k}"`).join(' '));
      if (idiomas.length) {
        const idiomaTermos = idiomas.map((i) => i.idioma).filter((idioma): idioma is string => Boolean(idioma));
        if (idiomaTermos.length) queryParts.push(idiomaTermos.join(' OR '));
      }
        if (minYears) queryParts.push(`${minYears}+ anos`);
    }

    const locationMap: Record<string, string> = {
      'brasil': 'Brazil', 'são paulo': 'São Paulo, Brazil', 'rio de janeiro': 'Rio de Janeiro, Brazil',
      'belo horizonte': 'Belo Horizonte, Brazil', 'curitiba': 'Curitiba, Brazil',
      'porto alegre': 'Porto Alegre, Brazil', 'salvador': 'Salvador, Brazil',
      'brasília': 'Brasília, Brazil', 'fortaleza': 'Fortaleza, Brazil'
    };
    const locLower = locationStr.trim().toLowerCase();
    if (locationMap[locLower]) locationStr = locationMap[locLower];

    const searchQuery = queryParts.filter(Boolean).join(" ");
    let results: LinkedinProfile[] = [];

    // No server-side mock fallback: require APIFY_TOKEN and fail on external scraping errors.

    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_TOKEN não configurado. Habilite a integração para buscas reais.' }, { status: 503 });
    }

    try {
      // ── PASSO 1: Dispara o scraper no Apify ──────────────────────
      const runRes = await fetchWithTimeout(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: searchQuery || "Professional",
          location: locationStr || "Brazil",
          maxResults: 25,
          proxy: { useApifyProxy: true }
        }),
      }, 30_000);

      if (!runRes.ok) {
        const errText = await runRes.text();
        logger.warn("Apify scraper start failed", { status: runRes.status, detail: errText });
        return NextResponse.json({ error: 'Falha ao iniciar extração externa' }, { status: 502 });
      } else {

      const runData = await runRes.json();
      const runId = runData.data.id;

      // ── PASSO 2: Polling ─────────────────────────────────────────
      let status = "RUNNING";
      let attempts = 0;
      const maxAttempts = 40;

      while (status === "RUNNING" || status === "READY") {
        if (attempts >= maxAttempts) {
          logger.warn("Timeout aguardando a extração do Apify, falling back to mock");
          status = "FAILED";
          break;
        }
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetchWithTimeout(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`, {}, 30_000);
        if (!statusRes.ok) break;
        const statusData = await statusRes.json();
        status = statusData.data.status;
        attempts++;
        if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
          logger.warn(`Scraper falhou com status: ${status}, falling back to mock`);
          break;
        }
      }

      if (status === "SUCCEEDED") {
        // ── PASSO 3: Busca os resultados ─────────────────────────────
        const datasetRes = await fetchWithTimeout(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`, {}, 30_000);
        if (!datasetRes.ok) {
          logger.warn("Falha ao buscar dataset do Apify");
          return NextResponse.json({ error: 'Falha ao obter resultados externos' }, { status: 502 });
        } else {
          const dataset = await datasetRes.json();

      // ── PASSO 4: Normaliza + Enriquece os perfis ─────────────────
      results = (dataset as ApifyItem[]).slice(0, 25).map((item, i) => {
        const firstName = item.firstName || "";
        const lastName = item.lastName || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ") || item.name || "Sem Nome";

        const currentPos = Array.isArray(item.currentPosition) ? item.currentPosition[0] : null;
        const company = currentPos?.companyName || item.company || item.companyName || "";
        const headline = item.headline || currentPos?.title || item.position || "";
        const locationText = (typeof item.location === "string" ? item.location : item.location?.linkedinText) || "";

        const posHistory = Array.isArray(item.positions) ? item.positions : [];
        let totalMonths = 0;
        posHistory.forEach((p) => {
          const start = p.startDate ? new Date(p.startDate) : null;
          const end = p.endDate ? new Date(p.endDate) : new Date();
          if (start) totalMonths += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
        });
        const experiencia_anos = Math.round(totalMonths / 12);

        if (minYears && experiencia_anos < parseInt(String(minYears))) return null;
        if (maxYears && experiencia_anos > parseInt(String(maxYears))) return null;

        const skills = Array.isArray(item.skills)
          ? item.skills.map((s) => (typeof s === "string" ? s : s.name || ""))
          : [];
        const experiencias = posHistory.slice(0, 4).map((p) => ({
          cargo: p.title || '',
          empresa: p.companyName || '',
          inicio: p.startDate || '',
          fim: p.endDate || null,
        }));
        const educations = Array.isArray(item.educations) ? item.educations : [];
        const formacao = educations[0]
          ? `${educations[0].fieldOfStudy || ''} — ${educations[0].schoolName || ''} (${educations[0].endDate ? new Date(educations[0].endDate).getFullYear() : ''})`
          : '';
        const langs = Array.isArray(item.languages)
          ? item.languages.map((l) => `${l.name || ""} (${l.proficiency || ''})`)
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
        }).filter((profile): profile is LinkedinProfile => Boolean(profile));
        }
      } else {
        logger.warn('Apify run did not succeed, status ' + status);
        return NextResponse.json({ error: 'Extração externa não finalizada' }, { status: 502 });
      }
      } // End of runRes.ok
    } catch (err: unknown) {
      logger.warn("Exceção ao executar o Apify scraper", err);
      return NextResponse.json({ error: 'Falha ao executar busca externa' }, { status: 502 });
    }
    

    // ── PASSO 5: Ordena — recentes/atualizados primeiro ──────────
    results.sort((a, b) => {
      const aHasCurrent = a.company ? 1 : 0;
      const bHasCurrent = b.company ? 1 : 0;
      if (bHasCurrent !== aHasCurrent) return bHasCurrent - aHasCurrent;
      return (b.experiencia_anos || 0) - (a.experiencia_anos || 0);
    });

    // ── PASSO 6: Salva no Supabase (best-effort com logs) ───────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const warnings = await persistLinkedinSearchArtifacts({
      supabase,
      empresaId: usuario.empresa_id,
      vagaId: vagaId || vaga_id || null,
      userId,
      searchQuery,
      filtros: body,
      results,
    });

    return NextResponse.json({ success: true, results, warnings, vagaId: vagaId || vaga_id || null });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
