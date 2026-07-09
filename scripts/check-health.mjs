import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

console.log('\n=== DIAGNÓSTICO RANKHIRE BR ===\n')

// 1. Verifica .env.local
const envPath = resolve(process.cwd(), '.env.local')
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
  'REDIS_URL',
  'NEXTAUTH_SECRET',
]

console.log('1. VARIÁVEIS DE AMBIENTE:')
if (!existsSync(envPath)) {
  console.log('  ❌ .env.local NÃO ENCONTRADO')
} else {
  const env = readFileSync(envPath, 'utf-8')
  requiredVars.forEach(v => {
    const presente = env.includes(v + '=') &&
      !env.includes(v + '=\n') &&
      !env.includes(v + '=\r')
    console.log(`  ${presente ? '✅' : '❌'} ${v}`)
  })
}

// 2. Verifica versões
console.log('\n2. VERSÕES:')
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
  console.log('  Next.js:', pkg.dependencies?.next || '?')
  console.log('  React:', pkg.dependencies?.react || '?')
  console.log('  Tailwind:', pkg.dependencies?.tailwindcss || '?')
  console.log('  Supabase:', pkg.dependencies?.['@supabase/supabase-js'] || '?')
  console.log('  BullMQ:', pkg.dependencies?.bullmq || '?')
} catch {
  console.log('  ❌ Não foi possível ler package.json')
}
console.log('  Node:', process.version)

// 3. Verifica arquivos críticos
console.log('\n3. ARQUIVOS CRÍTICOS:')
const criticalFiles = [
  'src/worker/pdf-worker.ts',
  'src/lib/supabase.ts',
  'src/lib/supabase-admin.ts',
  'middleware.ts',
  'next.config.ts',
  'tailwind.config.ts',
]
criticalFiles.forEach(f => {
  const p = resolve(f)
  const exists = existsSync(p)
  console.log(`  ${exists ? '✅' : '❌'} ${f}`)
  if (!exists) {
    // Auto-create simple stubs for missing files to help developers
    try {
      const dir = dirname(p)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      if (f === 'src/lib/supabase.ts') {
        const content = `import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
`
        writeFileSync(p, content, 'utf-8')
        console.log(`    ➕ Stub criado: ${f}`)
      } else if (f === 'src/lib/supabase-admin.ts') {
        const content = `import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
`
        writeFileSync(p, content, 'utf-8')
        console.log(`    ➕ Stub criado: ${f}`)
      } else if (f === 'tailwind.config.ts') {
        const content = `/** Tailwind stub created by check-health. Replace with project config. */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './painel-admin/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
`
        writeFileSync(p, content, 'utf-8')
        console.log(`    ➕ Stub criado: ${f}`)
      } else if (f === 'middleware.ts') {
        const content = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
`
        writeFileSync(p, content, 'utf-8')
        console.log(`    ➕ Stub criado: ${f}`)
      } else {
        // generic empty file
        writeFileSync(p, `// Stub file created by check-health. Replace with project-specific implementation.\n`, 'utf-8')
        console.log(`    ➕ Stub criado: ${f}`)
      }
    } catch (err) {
      console.log(`    ❌ Falha ao criar stub para ${f}:`, err.message)
    }
  }
})

console.log('\n=== FIM DO DIAGNÓSTICO ===\n')

process.exit(0)
