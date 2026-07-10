Reproduzir e depurar PDF Ranker (local)

Objetivo
- Reproduzir a lentidão do PDF Ranker localmente, coletar logs de timing e verificar decremento de cota (trial).

Pre-requisitos
- Projeto Supabase (remoto ou local) com as tabelas do schema aplicadas.
- Redis acessível (usado pela fila `pdf-processing`).
- Chaves/variáveis de ambiente configuradas (veja abaixo).
- Node 18+ e `npm`.

Variáveis de ambiente necessárias
- NEXT_PUBLIC_SUPABASE_URL — URL do projeto Supabase.
- NEXT_PUBLIC_SUPABASE_ANON_KEY — chave anon pública (client-side).
- SUPABASE_SERVICE_ROLE_KEY — chave service_role (server/admin).
- REDIS_URL — URL do Redis (ex.: redis://:password@host:6379).
- GROQ_API_KEY — chave para o provedor de IA (usado por `callAI`).
- PDF_WORKER_CONCURRENCY (opcional) — número de jobs concorrentes para o worker (default 3).

Instalação

```bash
npm ci
```

Rodando localmente

1) Rodar a aplicação Next.js (App Router):

```bash
# no Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL="https://..."; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."; $env:REDIS_URL="redis://..."; $env:GROQ_API_KEY="..."; npm run dev
```

2) Rodar o worker de processamento (em outra janela):

```bash
# usando ts-node via npx
$env:NEXT_PUBLIC_SUPABASE_URL="https://..."; $env:SUPABASE_SERVICE_ROLE_KEY="..."; $env:REDIS_URL="redis://..."; $env:GROQ_API_KEY="..."; npx ts-node src/worker/pdf-worker.ts
```

(Se preferir, compile/execute via um script Node apropriado. O importante é que o worker consiga ler as mesmas VARS de ambiente e conectar ao Redis.)

3) Fazer login na aplicação com um usuário de teste (trial). Verifique `empresas.limite_pdfs_mes` no Supabase para essa empresa (defina baixo para testes, ex.: 3).

4) Na UI, vá para `PDF Ranker` e faça upload de alguns PDFs. Observe os logs do servidor (`upload-batch`) — adicionamos logs para `downloadAndParsePdf` e `processCandidate` com durações em ms.

5) Verifique os logs do worker: você verá mensagens `AI call duration ms: ...` e `job completed` com `durationMs`. Use esses timestamps para identificar gargalos (download, parsing, AI call).

Verificação de cota
- A cota exibida pela UI agora é derivada de `/api/export-pdf` que conta `pdf_candidates` processados neste mês.
- Para validar, inspecione a tabela `pdf_candidates` no Supabase, coluna `created_at` e compare com a resposta de `/api/app-data` e `/api/export-pdf`.

Coleta de logs / debugging
- Procure por linhas com prefixos que adicionamos: `[upload-batch]`, `[Worker]`, `downloadAndParsePdf completed`.
- Exemplo de filtragem (PowerShell):

```powershell
# Exemplo: rodar worker e filtrar mensagens contendo 'AI call duration'
node -r ts-node/register src/worker/pdf-worker.ts 2>&1 | Select-String "AI call duration"
```

Observações
- Se o worker não iniciar, verifique `REDIS_URL` e permissões da chave `SUPABASE_SERVICE_ROLE_KEY`.
- Em produção, use um sistema de observabilidade (Logs + métricas) para coletar durations e contadores.

Próximos passos sugeridos
- Ajustar `PDF_WORKER_CONCURRENCY` para balancear CPU/IO e custo.
- Avaliar cache de URLs assinadas ou aumento do timeout de download se PDFs grandes.
- Monitorar latência do provedor de IA (GROQ) — latências altas geralmente dominam o tempo do job.

Arquivo gerado: RUNNING_PDF_RANKER.md
