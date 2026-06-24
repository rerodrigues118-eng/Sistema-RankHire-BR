import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca agentes ativos que precisam rodar
    // proxima_busca <= now() ou proxima_busca is null
    const { data: agentes, error: errAgentes } = await supabaseClient
      .from('agentes_ia')
      .select('*')
      .eq('status', 'ativo')
      .or(`proxima_busca.is.null,proxima_busca.lte.${new Date().toISOString()}`)
      .limit(10); // Batch de 10 por execução para evitar timeout

    if (errAgentes || !agentes || agentes.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum agente pendente.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const apifyToken = Deno.env.get('APIFY_TOKEN') || '';
    const groqKey = Deno.env.get('GROQ_API_KEY') || '';

    const results = [];

    // Processa cada agente
    for (const agente of agentes) {
      console.log(`Iniciando execução do agente: ${agente.id}`);
      
      // Cria o registro no run
      const { data: runRecord } = await supabaseClient
        .from('agente_runs')
        .insert({ agente_id: agente.id, status: 'rodando' })
        .select('id')
        .single();
        
      const runId = runRecord?.id;
      let perfisAnalisados = 0;
      let candidatosEncontrados = 0;
      let candidatosScoreAlto = 0;

      try {
        // [AQUI OCORRERIA A CHAMADA AO APIFY PARA BUSCAR PERFIS]
        // Exemplo simplificado (mock para compilação estrutural):
        // const searchResult = await fetchApifyGoogleSearch(agente.filtros_ia);
        
        // Simulação de candidatos retornados
        const mockProfiles = []; // Array vazio provisório

        for (const profile of mockProfiles) {
          perfisAnalisados++;
          
          // [AQUI OCORRERIA A CHAMADA AO GROQ PARA SCORING]
          // ... fetch Groq completion ...
          const score = 4.2; // mock
          
          if (score >= agente.score_minimo_notificacao) {
             candidatosScoreAlto++;
          }
          
          // Insere candidato (evita erro de constraint UNIQUE se já existe)
          const { error: insErr } = await supabaseClient
            .from('agente_candidatos')
            .insert({
              agente_id: agente.id,
              linkedin_url: '...', // mock
              dados_perfil: profile,
              score_final: score,
              criterios_avaliacao: {},
              status: 'novo'
            });
            
          if (!insErr) candidatosEncontrados++;
        }

        // Calcula proxima busca com base na frequencia
        let nextRun = new Date();
        if (agente.frequencia === 'diaria') {
          nextRun.setDate(nextRun.getDate() + 1);
        } else if (agente.frequencia === 'semanal') {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          // Manual: não seta proxima_busca automaticamente
          nextRun = new Date(3000, 0, 1); 
        }

        // Atualiza o agente
        await supabaseClient
          .from('agentes_ia')
          .update({ 
            ultima_busca: new Date().toISOString(),
            proxima_busca: agente.frequencia !== 'manual' ? nextRun.toISOString() : null
          })
          .eq('id', agente.id);

        // Atualiza o run
        if (runId) {
          await supabaseClient
            .from('agente_runs')
            .update({ 
              status: 'concluido',
              perfis_analisados: perfisAnalisados,
              candidatos_encontrados: candidatosEncontrados,
              candidatos_score_alto: candidatosScoreAlto
            })
            .eq('id', runId);
        }

        results.push({ agente: agente.id, status: 'success' });

        // [AQUI OCORRERIA O DISPARO DE NOTIFICAÇÃO/WEBHOOK N8N]
        if (candidatosScoreAlto > 0) {
           console.log(`Disparar webhook n8n informando ${candidatosScoreAlto} achados`);
        }

      } catch (agentError) {
        console.error(`Erro no agente ${agente.id}:`, agentError);
        if (runId) {
          await supabaseClient
            .from('agente_runs')
            .update({ status: 'erro', logs: { error: String(agentError) } })
            .eq('id', runId);
        }
        results.push({ agente: agente.id, status: 'error' });
      }
    }

    return new Response(JSON.stringify({ message: 'Agentes executados', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
