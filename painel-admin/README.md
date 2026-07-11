# Painel Administrativo - RankHire BR

Painel administrativo isolado da aplicação RankHire BR, construído com Next.js 16 e Tailwind CSS.

## Setup Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`

## Build para Produção

```bash
npm run build
npm start
```

## Deploy na Vercel

### Opção 1: Via GitHub (Recomendado)

1. Push do código para `main` branch
2. Conecte em [Vercel Dashboard](https://vercel.com)
3. Configure variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático ativado

### Opção 2: Via CLI

```bash
npm install -g vercel
vercel
```

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```