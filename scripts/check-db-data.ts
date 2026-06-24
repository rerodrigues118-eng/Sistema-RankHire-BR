import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log("=== DB CHECK ===");
  
  const { data: users, error: errUsers } = await supabase.from("usuarios").select("*");
  console.log("Usuarios count:", users?.length, "Error:", errUsers);
  if (users && users.length > 0) {
    console.log("First User:", users[0]);
  }
  
  const { data: vagas, error: errVagas } = await supabase.from("vagas").select("*");
  console.log("Vagas count:", vagas?.length, "Error:", errVagas);
  if (vagas && vagas.length > 0) {
    console.log("Vagas:", vagas);
  }

  const { data: criteria, error: errCriteria } = await supabase.from("criteria").select("*");
  console.log("Criteria count:", criteria?.length, "Error:", errCriteria);
  if (criteria && criteria.length > 0) {
    console.log("Criteria details:", criteria);
  }

  const { data: candidates, error: errCandidates } = await supabase.from("pdf_candidates").select("*");
  console.log("PDF Candidates count:", candidates?.length, "Error:", errCandidates);
  if (candidates && candidates.length > 0) {
    console.log("First Candidate:", candidates[0]);
  }

  const { data: evals, error: errEvals } = await supabase.from("candidate_evaluations").select("*");
  console.log("Candidate Evaluations count:", evals?.length, "Error:", errEvals);
}

run();
