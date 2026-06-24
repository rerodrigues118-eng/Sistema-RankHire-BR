import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixJobId() {
  const { data } = await supabase.from('vagas').select('id').eq('title', 'Senior Full Stack Engineer').single();
  
  if (data) {
    let content = fs.readFileSync('src/lib/mock-data.ts', 'utf8');
    content = content.replace(/id: "job-1"/, 'id: "' + data.id + '"');
    fs.writeFileSync('src/lib/mock-data.ts', content);
    console.log('UUID injetado no frontend: ' + data.id);
  } else {
    console.log('Vaga não encontrada');
  }
}

fixJobId();
