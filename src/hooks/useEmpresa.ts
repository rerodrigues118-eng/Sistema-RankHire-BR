"use client";

import { useEffect, useState } from "react";
import type { EmpresaPlano } from "@/lib/plano-access";

export function useEmpresa() {
  const [empresa, setEmpresa] = useState<EmpresaPlano | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/empresas", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setEmpresa(data.empresa || null);
      } catch {
        // ignore
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return { empresa, isLoading };
}
