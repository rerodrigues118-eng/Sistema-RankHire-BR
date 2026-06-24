import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

async function diagnostico() {
  console.log('\n=== DIAGNÓSTICO RANKHIRE BR ===\n')

  // Teste 1: Variáveis de ambiente
  console.log('1. VARIÁVEIS DE AMBIENTE:')
  console.log('  REDIS_URL:', process.env.REDIS_URL ? '✅ presente' : '❌ AUSENTE')
  console.log('  GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ presente' : '❌ AUSENTE')
  console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ presente' : '❌ AUSENTE')
  console.log('  SERVICE_ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ presente' : '❌ AUSENTE')

  // Teste 2: Conexão Redis
  console.log('\n2. CONEXÃO REDIS:')
  try {
    const redis = new Redis(process.env.REDIS_URL!, {
      tls: {},
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
    })
    await redis.ping()
    console.log('  Redis: ✅ conectado')
    
    // Verifica jobs na fila
    const queue = new Queue('pdf-processing', { connection: redis })
    const waiting = await queue.getWaiting()
    const active = await queue.getActive()
    const failed = await queue.getFailed()
    console.log(`  Jobs aguardando: ${waiting.length}`)
    console.log(`  Jobs ativos: ${active.length}`)
    console.log(`  Jobs com falha: ${failed.length}`)
    
    if (failed.length > 0) {
      console.log('\n  ERROS DOS JOBS FALHOS:')
      failed.slice(0, 3).forEach(job => {
        console.log(`  Job ${job.id}: ${job.failedReason}`)
      })
    }
    
    // Mostra detalhes dos jobs ativos/aguardando
    const allJobs = [...waiting, ...active]
    if (allJobs.length > 0) {
      console.log('\n  DETALHES DOS JOBS NA FILA:')
      allJobs.slice(0, 5).forEach(job => {
        console.log(`  Job ${job.id}: status=${job.status}, dados=${JSON.stringify(job.data)}`)
      })
    }
    
    await redis.quit()
  } catch (err: any) {
    console.log('  Redis: ❌ ERRO -', err.message)
  }

  // Teste 3: Supabase
  console.log('\n3. SUPABASE:')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase.from('pdf_candidates').select('id, status').limit(3)
    if (error) {
      console.log('  Supabase: ❌ ERRO -', error.message)
    } else {
      console.log('  Supabase: ✅ conectado')
      console.log(`  Candidatos encontrados: ${data.length}`)
      data.forEach(c => console.log(`    ID: ${c.id}, status: ${c.status}`))
    }
  } catch (err: any) {
    console.log('  Supabase: ❌ ERRO -', err.message)
  }

  // Teste 4: Groq API
  console.log('\n4. GROQ API:')
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    })
    console.log('  Groq: ' + (res.ok ? '✅ conectado' : `❌ erro ${res.status}`))
    if (!res.ok) {
      const text = await res.text()
      console.log('  Detalhe:', text.slice(0, 200))
    }
  } catch (err: any) {
    console.log('  Groq: ❌ ERRO -', err.message)
  }

  console.log('\n=== FIM DO DIAGNÓSTICO ===\n')
  process.exit(0)
}

diagnostico()
