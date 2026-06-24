require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log("Verificando colunas existentes...");

  // Check if columns already exist
  const { data: testCol, error: testErr } = await admin
    .from("pdf_candidates")
    .select("pretensao_salarial")
    .limit(1);

  if (!testErr) {
    console.log("Colunas de CV ja existem.");
  } else {
    console.log("Colunas ausentes - precisa rodar SQL no Supabase Dashboard.");
    console.log("SQL a executar:");
    console.log(`
ALTER TABLE pdf_candidates 
  ADD COLUMN IF NOT EXISTS pretensao_salarial TEXT,
  ADD COLUMN IF NOT EXISTS disponibilidade TEXT,
  ADD COLUMN IF NOT EXISTS regime_preferido TEXT,
  ADD COLUMN IF NOT EXISTS resumo_ia TEXT;
    `);
  }

  // Check if pdf_exports exists
  const { data: testExports, error: exportsErr } = await admin
    .from("pdf_exports")
    .select("id")
    .limit(1);

  if (!exportsErr) {
    console.log("Tabela pdf_exports ja existe.");
  } else {
    console.log("Tabela pdf_exports ausente. SQL a executar:");
    console.log(`
CREATE TABLE IF NOT EXISTS pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID,
  candidate_id UUID REFERENCES pdf_candidates(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ DEFAULT now(),
  mes_referencia TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pdf_exports_empresa_mes 
  ON pdf_exports(empresa_id, mes_referencia);
    `);
  }

  // Backfill: extract data already present in parsed_text using regex
  console.log("\nIniciando backfill de dados dos CVs ja processados...");

  const { data: candidates, error: candErr } = await admin
    .from("pdf_candidates")
    .select("id, parsed_text, email_contato, telefone, linkedin_url, cidade, cargo_atual, empresa_atual")
    .not("parsed_text", "is", null);

  if (candErr) {
    console.error("Erro ao buscar candidatos:", candErr.message);
    return;
  }

  console.log(`Encontrados ${candidates.length} candidatos com parsed_text`);
  let updated = 0;

  for (const cand of candidates) {
    const text = cand.parsed_text || "";
    const updates = {};

    // Extract email if missing
    if (!cand.email_contato) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) updates.email_contato = emailMatch[0];
    }

    // Extract phone if missing
    if (!cand.telefone) {
      const phoneMatch = text.match(/(\(?\d{2}\)?\s?[\d\s\-\.]{8,13}\d)/);
      if (phoneMatch) {
        const cleaned = phoneMatch[0].replace(/[\s\-\.]/g, "").trim();
        if (cleaned.length >= 10) updates.telefone = phoneMatch[0].trim();
      }
    }

    // Extract LinkedIn if missing
    if (!cand.linkedin_url) {
      const liMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_]+/i);
      if (liMatch) updates.linkedin_url = "https://" + liMatch[0];
    }

    // Extract city if missing (Brazilian state pattern)
    if (!cand.cidade) {
      const cityMatch = text.match(/([A-ZÀ-Ú][a-zA-Zà-ú\s]+),?\s+(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\s*[-–·]?\s*(Brasil)?/);
      if (cityMatch) updates.cidade = cityMatch[0].trim().replace(/\s*[-–·]\s*$/, "");
    }

    if (Object.keys(updates).length > 0) {
      const { error: upErr } = await admin
        .from("pdf_candidates")
        .update(updates)
        .eq("id", cand.id);

      if (upErr) {
        console.error(`Erro ao atualizar ${cand.id}:`, upErr.message);
      } else {
        updated++;
        console.log(`Atualizado candidato ${cand.id}:`, updates);
      }
    }
  }

  console.log(`\nBackfill concluido: ${updated} candidatos atualizados.`);
}

migrate().catch(console.error);
