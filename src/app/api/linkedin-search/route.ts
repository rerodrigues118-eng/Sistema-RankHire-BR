import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchWithTimeout, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";

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

export async function POST(req: Request) {
  try {
    const { userId, supabase: userSupabase } = await requireAuth();
    const body = (await req.json()) as LinkedInSearchBody;
    const apiKey = process.env.APIFY_TOKEN;
    const { data: usuario } = await userSupabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada para este usuario" }, { status: 404 });
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
    } = body;

    let queryParts: string[] = [];
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
      if (location) locationStr = location;
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
    let isMock = false;

    if (!apiKey) {
      isMock = true;
      await new Promise((r) => setTimeout(r, 1400));
      results = [
        {
          id: 'mock-1',
          name: 'Ana Lima (Demo)',
          headline: job_titles[0] || title || 'Designer',
          company: 'Nubank',
          location: locationStr,
          linkedinUrl: 'https://linkedin.com/in/ana-lima-demo',
          avatarUrl: null,
          fit: 0,
          resumo: 'Profissional com forte experiência em design e ferramentas digitais.',
          experiencia_anos: 5,
          skills: ['Figma', 'Email Marketing', 'CRM'],
          experiencias: [
            { cargo: 'Designer Sr.', empresa: 'Nubank', inicio: '2022-01-01', fim: null },
            { cargo: 'Designer', empresa: 'iFood', inicio: '2020-01-01', fim: '2021-12-01' }
          ],
          formacao: 'Design Gráfico — USP (2019)',
          idiomas: ['Inglês (Fluente)', 'Espanhol (Intermediário)'],
          sobre: 'Profissional apaixonada por design e inovação.',
        },
        {
          id: 'mock-2',
          name: 'Carlos Menezes (Demo)',
          headline: job_titles[0] || title || 'Product Designer',
          company: 'Itaú',
          location: 'São Paulo, SP',
          linkedinUrl: 'https://linkedin.com/in/carlos-menezes-demo',
          avatarUrl: null,
          fit: 0,
          resumo: 'Designer com foco em produtos digitais e UI/UX.',
          experiencia_anos: 3,
          skills: ['Figma', 'UX Research', 'Prototyping'],
          experiencias: [
            { cargo: 'Product Designer', empresa: 'Itaú', inicio: '2023-01-01', fim: null },
          ],
          formacao: 'Design — ESPM (2022)',
          idiomas: ['Inglês (Avançado)'],
          sobre: 'Designer focado em UX para serviços financeiros.',
        },
        {
          id: 'mock-3',
          name: 'Fernanda Souza (Demo)',
          headline: 'Email Designer & CRM Specialist',
          company: 'Magazine Luiza',
          location: 'São Paulo, SP',
          linkedinUrl: 'https://linkedin.com/in/fernanda-souza-demo',
          avatarUrl: null,
          fit: 0,
          resumo: 'Especialista em email marketing com foco em conversão.',
          experiencia_anos: 7,
          skills: ['Email Marketing', 'CRM', 'Figma', 'HubSpot', 'Mailchimp'],
          experiencias: [
            { cargo: 'Email Designer Sr.', empresa: 'Magazine Luiza', inicio: '2021-06-01', fim: null },
            { cargo: 'Designer de CRM', empresa: 'Submarino', inicio: '2018-01-01', fim: '2021-05-01' }
          ],
          formacao: 'Publicidade & Propaganda — ESPM (2017)',
          idiomas: ['Inglês (Fluente)', 'Espanhol (Básico)'],
          sobre: 'Apaixonada por estratégia de email e automação de marketing.',
        }
      ];
    } else {
      // ── PASSO 1: Dispara o scraper no Apify ──────────────────────
      const runRes = await fetchWithTimeout(`https://api.apify.com/v2/acts/hpvQmM3KODjMJLvYk/runs?token=${apiKey}`, {
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
        return NextResponse.json({ error: "Falha ao iniciar o Apify Scraper", detail: errText }, { status: runRes.status });
      }

      const runData = await runRes.json();
      const runId = runData.data.id;

      // ── PASSO 2: Polling ─────────────────────────────────────────
      let status = "RUNNING";
      let attempts = 0;
      const maxAttempts = 40;

      while (status === "RUNNING" || status === "READY") {
        if (attempts >= maxAttempts) {
          return NextResponse.json({ error: "Timeout aguardando a extração do Apify" }, { status: 504 });
        }
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetchWithTimeout(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`, {}, 30_000);
        if (!statusRes.ok) break;
        const statusData = await statusRes.json();
        status = statusData.data.status;
        attempts++;
        if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
          return NextResponse.json({ error: `Scraper falhou com status: ${status}` }, { status: 500 });
        }
      }

      // ── PASSO 3: Busca os resultados ─────────────────────────────
      const datasetRes = await fetchWithTimeout(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`, {}, 30_000);
      if (!datasetRes.ok) {
        return NextResponse.json({ error: "Falha ao buscar dataset do Apify" }, { status: datasetRes.status });
      }
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

    // ── PASSO 5: Ordena — recentes/atualizados primeiro ──────────
    results.sort((a, b) => {
      const aHasCurrent = a.company ? 1 : 0;
      const bHasCurrent = b.company ? 1 : 0;
      if (bHasCurrent !== aHasCurrent) return bHasCurrent - aHasCurrent;
      return (b.experiencia_anos || 0) - (a.experiencia_anos || 0);
    });

    // ── PASSO 6: Salva no Supabase (best-effort) ─────────────────
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from("linkedin_searches").insert({
        empresa_id: usuario.empresa_id,
        query: searchQuery,
        filtros: body,
        resultados: results,
        expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (_) {
      // Ignora erro se tabela não existir
    }

    return NextResponse.json({ success: true, results, isMock });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
