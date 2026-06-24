"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Erro no painel admin</h1>
        <p className="mt-3 text-sm text-slate-600">
          A visão administrativa falhou ao carregar. Recarregue para tentar novamente.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}
