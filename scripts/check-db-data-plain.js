import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("=== DB CHECK PLAIN ===");
  try {
    const { data: users, error: errUsers } = await supabase.from("usuarios").select("id, email, empresa_id");
    console.log("Usuarios count:", users?.length, "Error:", errUsers);
    if (users) console.log("Users:", users);

    const { data: vagas, error: errVagas } = await supabase.from("vagas").select("id, titulo, empresa_id");
    console.log("Vagas count:", vagas?.length, "Error:", errVagas);
    if (vagas) console.log("Vagas:", vagas);

    const { data: candidates, error: errCandidates } = await supabase.from("pdf_candidates").select("id, nome_candidato, score_final, status");
    console.log("PDF Candidates count:", candidates?.length, "Error:", errCandidates);
    if (candidates) {
      candidates.forEach(c => {
        console.log(`- Candidate ID: ${c.id}, Name: ${c.nome_candidato}, Score: ${c.score_final}, Status: ${c.status}`);
      });
    }
  } catch (e) {
    console.error("Error running DB check:", e);
  }
}

run();
