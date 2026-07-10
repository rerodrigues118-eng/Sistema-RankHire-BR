# Auditoria Detalhada — Conexões MCP / `createSupabaseAdminClient()`

Este documento lista rotas que usam o cliente admin/service-role (`createSupabaseAdminClient()`), indica se há verificação de autenticação e se a rota aplica filtro `empresa_id` antes de ler/escrever dados multitenant.

Resumo rápido:
- Total de rotas observadas: 29
- Padrão observado: a maioria chama `requireAuth()` (ou recupera `userId`) e busca `empresa_id` via admin.from('usuarios').select(...).eq('id', userId). Em muitos casos a rota aplica `.eq('empresa_id', empresaId)` em queries subsequentes.
- Ações recomendadas: preferir cliente autenticado (`supabase` retornado por `requireAuth()`) para operações do usuário quando possível; limitar admin-client a tarefas de manutenção/backfill/webhooks; sempre validar `empresa_id` explicitamente antes de modificações com admin-client.

Detalhes por rota (observações resumidas):

- `src/app/api/app-data/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (recupera via `usuarios` e aplica `.eq('empresa_id', empresaId)` em queries)
  - Observação: rota faz inicialização demo (criação de job/padrão), atualiza pdf_candidates/pdf_batches órfãos. Uso admin justificado para backfill/maintenance, mas confirmar que operação só afeta a empresa do usuário.

- `src/app/api/export-pdf/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (valida `usuario.empresa_id` e usa para inserts/contagens)
  - Observação: admin usado para inserir em `pdf_exports`. Operação aceitável, mas contagens agora alinham-se a `pdf_candidates` (mudança aplicada).

- `src/app/api/upload-batch/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (verifica vaga e `vaga.empresa_id` antes de criar lote e candidatos)
  - Observação: admin é apropriado para criar batches e atualizar múltiplas tabelas, mas checar RLS e garantir que `vaga_id` pertence ao usuário.

- `src/app/api/candidate-etiquetas/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (valida `pdf_candidates` e `etiquetas` pertencem à mesma `empresa_id`)
  - Observação: boa prática — rota valida ambos os recursos antes de alterações.

- `src/app/api/candidates/*` (plural, import, rescore, individual routes)
  - `requireAuth()`: sim em todas as variantes
  - Filtra/valida `empresa_id`: sim (consulta `usuarios` e aplica `.eq('empresa_id', usuario.empresa_id)`)
  - Observação: algumas rotas usam admin para leituras e updates; preferir usar `supabase` autenticado + RLS para leituras/ações rotineiras; admin apenas para imports/backfills.

- `src/app/api/agentes/*` (routes)
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (usa `usuarios` via admin para obter `empresa_id` e aplica filtros)
  - Observação: criação/execução de agentes envolve vários updates — ok com admin, mas revisar se endpoints públicos podem ser feitos com client autenticado.

- `src/app/api/empresas/route.ts` e `src/app/api/profile/*`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim onde necessário
  - Observação: rotas de perfil/empresa frequentemente usam admin para leituras de dados anotados; preferir cliente autenticado quando se trata de dados do próprio usuário/empresa.

- `src/app/api/etiquetas/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim
  - Observação: válida verificar `empresa_id` antes de inserir/atualizar.

- `src/app/api/linkedin-search/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (insere `empresa_id` em logs/registro)
  - Observação: manter admin apenas para operações que escrevem logs cruzados; busca por dados de usuário pode ser feita com supabase auth.

- `src/app/api/pagarme/*` (webhook, assinar)
  - `requireAuth()`: webhooks não usam `requireAuth()` (são endpoints externos)
  - Filtra/valida `empresa_id`: sim quando processa metadata
  - Observação: webhooks precisam usar admin para gravar dados de cobrança; garanta validação de payload e logs.

- `src/app/api/batches/[id]/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: sim (consulta `pdf_candidates` e batches por `empresa_id`)
  - Observação: adequada validação de escopo.

- `src/app/api/profile/verify-change/route.ts`
  - `requireAuth()`: sim
  - Filtra/valida `empresa_id`: N/A (opera sobre o `userId`)
  - Observação: admin usado para atualizar `usuarios` — aceitável se for operação segurada por requireAuth e confirmar `userId`.

- Outras rotas notáveis que usam admin e foram verificadas (resumo):
  - `src/app/api/agentes/[id]/calibracoes/route.ts` — requireAuth + valida empresa_id
  - `src/app/api/candidates/import/route.ts` — requireAuth + valida empresa_id (import/backfill)
  - `src/app/api/candidates/[id]/rescore/route.ts` — requireAuth + valida empresa_id
  - `src/app/api/profile/labels/route.ts` — requireAuth + valida empresa_id
  - `src/app/api/etiquetas/route.ts` — requireAuth + valida empresa_id
  - `src/app/api/vagas/*` — requireAuth + valida empresa_id

Observações gerais e recomendações práticas
-----------------------------------------
- Preferir `supabase` autenticado para operações originadas por usuários. Use `createSupabaseAdminClient()` apenas quando necessário (backfills, correções em massa, webhooks que recebem eventos externos, tarefas do worker).
- Quando usar admin client em rotas que respondem a usuários, sempre:
  - Chamar `requireAuth()` para obter `userId`.
  - Recuperar e validar explicitamente `empresa_id` do usuário antes de qualquer mudança.
  - Aplicar `.eq('empresa_id', empresaId)` em todas as queries que leem ou escrevem dados multitenant.
  - Adicionar comentário `// admin-client: justified` explicando por que o admin é necessário.
- Auditar RLS nas tabelas sensíveis: `pdf_candidates`, `pdf_batches`, `vagas`, `empresas`, `pdf_exports`, `usuarios`, `etiquetas`.

Próximos passos que posso executar agora
-------------------------------------
- Gerar um patch adicionando comentários `// admin-client: justified` em rotas que realmente precisam de admin e estão corretas.
- Reescrever rotas que usam admin apenas para leituras simples para utilizar o `supabase` autenticado (quando RLS cobre o caso).
- Executar testes locais do fluxo trial e reproduzir limite de cota com a nova contagem (requer ambiente com Supabase + Redis/worker).

Arquivo gerado automaticamente em: 2026-07-10
