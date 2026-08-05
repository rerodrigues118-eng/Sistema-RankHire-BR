import type { PageId } from "@/lib/types";

export const PAGE_HREFS: Record<PageId, string> = {
  dashboard: "/dashboard",
  vagas: "/vagas",
  "pdf-ranker": "/pdf-ranker",
  linkedin: "/busca-inteligente",
  "agente-ia": "/agente-ia",
  pipeline: "/pipeline",
  candidatos: "/candidatos",
  analytics: "/analytics",
  settings: "/configuracoes",
};

export function getPageFromPath(pathname: string): PageId | null {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  switch (normalized) {
    case "/dashboard":
      return "dashboard";
    case "/vagas":
      return "vagas";
    case "/pdf-ranker":
      return "pdf-ranker";
    case "/busca-inteligente":
      return "linkedin";
    case "/agente-ia":
      return "agente-ia";
    case "/pipeline":
      return "pipeline";
    case "/candidatos":
      return "candidatos";
    case "/analytics":
      return "analytics";
    case "/configuracoes":
      return "settings";
    default:
      return null;
  }
}
