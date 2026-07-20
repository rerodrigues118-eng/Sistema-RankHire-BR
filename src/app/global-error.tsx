"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            padding: "24px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <span style={{ fontSize: "24px" }}>!</span>
            </div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#0f172a",
                margin: "0 0 8px",
              }}
            >
              Erro crítico na aplicação
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              Algo inesperado aconteceu e a página não pôde ser carregada.
              Tente recarregar ou volte mais tarde.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  margin: "0 0 16px",
                  fontFamily: "monospace",
                }}
              >
                ID do erro: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                background: "#0f172a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
