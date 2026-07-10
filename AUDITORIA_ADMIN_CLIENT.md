# Auditoria: uso de createSupabaseAdminClient()

Lista de rotas que chamam `createSupabaseAdminClient()` (service-role/admin) e observações sobre privilégios.

- src/app/api/app-data/route.ts
  - Uso: leitura e criação de demo job, atualizações de `pdf_candidates`/`pdf_batches` órfãos.
  - Risco: rota rodando como admin é aceitável para correções administrativas, mas deve garantir `requireAuth()` e verificar `empresa_id` para evitar alterações em empresas alheias.

- src/app/api/export-pdf/route.ts
  - Uso: registra exportações e conta uso de `pdf_candidates`.
  - Risco: precisa usar admin para inserir em `pdf_exports`, mas contagens podem ser feitas com menor privilégio. Mantém `requireAuth()` e valida `empresa_id`.

- src/app/api/upload-batch/route.ts
  - Uso: criação de `pdf_batches` e inserção/atualização em `pdf_candidates` e processamento IA.
  - Risco: operação sensível — admin client apropriado; porém garanta validação de `vaga_id` e `empresa_id` para evitar escalonamento de privilégios.

- src/app/api/candidates/* and src/app/api/candidate-etiquetas/*
  - Uso: manipulação de `pdf_candidates` (labels, rescore, import).
  - Risco: Rotas de usuário deveriam usar supabase normal com RLS + `requireAuth()`. Se usam admin, revisar porque.

- src/app/api/profile/* and empresas/route.ts
  - Uso: leitura/escrita em `empresas`, `usuarios` e perfis.
  - Risco: admin client deve ser usado com cautela; preferir queries com o cliente autenticado quando possível e deixar admin apenas para operações cross-empresa ou correções.

- src/app/api/agentes/* and vagas/*
  - Uso: criação/leitura de agentes, critérios, vagas.
  - Risco: se rotas destinam-se a usuários da empresa, RLS com cliente autenticado é preferível; admin para tarefas de manutenção.

Recomendações:
- Preferir o cliente autenticado (`supabase` retornado por `requireAuth()`) para operações originadas de usuários, deixando `createSupabaseAdminClient()` só para tarefas administrativas e manutenção (migrations, backfills, webhooks).
- Garantir que qualquer uso do admin client valide `empresa_id` explicitamente quando modificar dados multitenant.
- Auditar RLS policies para `pdf_candidates`, `vagas`, `empresas`, `pdf_batches` e `pdf_exports`.
- Registrar no código comentários `// admin-client: justified` nos pontos onde o admin é estritamente necessário.

Executado em: 2026-07-10
