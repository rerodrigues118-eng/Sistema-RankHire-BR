"use client";

import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ background: '#0d1117', color: '#e6edf3', padding: 32 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ color: '#ff6b6b' }}>Erro no servidor</h1>
          <p style={{ color: '#c9d1d9' }}>Ocorreu um erro ao processar esta página.</p>
          <div style={{ marginTop: 18, padding: 18, background: '#0b1220', borderRadius: 8, border: '1px solid #23272b' }}>
            <p style={{ fontWeight: 600 }}>Mensagem:</p>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#adbac7' }}>{String(error?.message || 'Erro desconhecido')}</pre>
          </div>
          <div style={{ marginTop: 18 }}>
            <p style={{ color: '#8b949e' }}>Possíveis causas:</p>
            <ul style={{ color: '#8b949e' }}>
              <li>Variáveis de ambiente do Supabase não configuradas em produção (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).</li>
              <li>Erro interno na aplicação. Verifique os logs do Vercel para detalhes.</li>
            </ul>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <button onClick={() => reset()} style={{ background: '#238636', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none' }}>Tentar novamente</button>
          </div>
        </div>
      </body>
    </html>
  );
}
