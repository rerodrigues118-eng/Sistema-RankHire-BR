import { fetchWithTimeout, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type ApolloPerson = {
  id?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  organization?: { name?: string };
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  photo_url?: string | null;
};

export async function POST(req: Request) {
  try {
    await requireAuth();
    const { titles = [], keywords = [], locations = [] } = (await req.json()) as {
      titles?: string[];
      keywords?: string[];
      locations?: string[];
    };

    const apiKey = process.env.APOLLO_API_KEY;

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      return NextResponse.json({
        success: true,
        isMock: true,
        results: [
          {
            id: "mock-1",
            name: "Carlos Eduardo Silva",
            headline: titles[0] || "Senior Engineer",
            company: "TechCorp Brasil",
            location: locations[0] || "Sao Paulo, SP",
            linkedinUrl: "https://linkedin.com/in/carlos-eduardo-mock",
            avatarUrl: null,
          },
          {
            id: "mock-2",
            name: "Mariana Souza",
            headline: titles.length > 1 ? titles[1] : titles[0] || "Product Designer",
            company: "Innovate Solutions",
            location: locations[0] || "Rio de Janeiro, RJ",
            linkedinUrl: "https://linkedin.com/in/mariana-souza-mock",
            avatarUrl: null,
          },
        ],
      });
    }

    const res = await fetchWithTimeout(
      "https://api.apollo.io/v1/mixed_people/api_search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          api_key: apiKey,
          person_titles: titles,
          q_person_keyword: keywords.join(" "),
          person_locations: locations,
          page: 1,
          per_page: 10,
        }),
      },
      30_000,
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Falha na comunicacao com Apollo.io" }, { status: res.status });
    }

    const data = (await res.json()) as { people?: ApolloPerson[] };
    const results = (data.people || []).map((person) => ({
      id: person.id,
      name: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
      headline: person.title || "Sem cargo",
      company: person.organization?.name || "Empresa nao informada",
      location: person.city ? `${person.city}, ${person.state || person.country || ""}` : "Localizacao nao informada",
      linkedinUrl: person.linkedin_url || "#",
      avatarUrl: person.photo_url || null,
    }));

    return NextResponse.json({ success: true, results, isMock: false });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
