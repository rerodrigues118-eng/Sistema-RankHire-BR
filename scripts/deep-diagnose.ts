import { createClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // 1. Check ALL candidates
  const { data: allCands, error } = await supabase
    .from('pdf_candidates')
    .select('id, status, score_final, nome_candidato, batch_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro query candidatos:', error.message)
  } else {
    console.log(`Total candidatos: ${allCands.length}`)
    allCands.forEach(c => console.log(`  ${c.id.slice(0,8)}... | status: ${c.status} | score: ${c.score_final ?? '-'} | nome: ${(c.nome_candidato || '(sem)').slice(0,30)}`))
  }

  // 2. Check candidate_evaluations
  const { data: evals } = await supabase
    .from('candidate_evaluations')
    .select('id, candidate_id, criteria_id, nota')
    .limit(10)

  if (evals) {
    console.log(`\nEvaluations: ${evals.length}`)
    evals.forEach(e => console.log(`  cand: ${e.candidate_id.slice(0,8)}... | crit: ${e.criteria_id?.slice(0,8)||'-'} | nota: ${e.nota}`))
  }

  // 3. Check Redis for active jobs
  const redis = new Redis(process.env.REDIS_URL!, {
    tls: {}, maxRetriesPerRequest: null, enableReadyCheck: false, connectTimeout: 5000,
  })
  const queue = new Queue('pdf-processing', { connection: redis })
  const active = await queue.getActive()
  const failed = await queue.getFailed()
  console.log(`\nRedis - Ativos: ${active.length}, Falhos: ${failed.length}`)
  active.forEach(j => console.log(`  Job ${j.id}: ${j.data.candidateId?.slice(0,8)}...`))
  failed.forEach(j => console.log(`  Job ${j.id} falhou: ${j.failedReason?.slice(0,200)}`))
  await redis.quit()
}

check()
