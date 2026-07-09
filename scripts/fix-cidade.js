import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Fix cidade backfill with better regex
  const { data: candidates } = await admin
    .from("pdf_candidates")
    .select("id, parsed_text, cidade")
    .not("parsed_text", "is", null);

  for (const cand of candidates) {
    const text = cand.parsed_text || "";
    const updates = {};

    // Better city regex: "City Name, UF" at start of lines or after name
    // Looks for patterns like "Pinheirinho, Curitiba - PR" or "São Paulo - SP" or "Curitiba - PR"
    const cityPatterns = [
      // "Bairro, Cidade - UF" or "Cidade - UF"
      /([A-ZÀ-Ú][a-zA-Zà-ú\s]+),\s+([A-ZÀ-Ú][a-zA-Zà-ú\s]+)\s*[-–]\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)/,
      // Just "City - UF"
      /([A-ZÀ-Ú][a-zA-Zà-ú\s]{2,})\s*[-–]\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/,
    ];

    // Try to fix city — only if currently wrong (contains "MATEUS" etc)
    if (!cand.cidade || cand.cidade.toUpperCase().includes("MATEUS") || cand.cidade.toUpperCase().includes("HENRIQUE")) {
      for (const pattern of cityPatterns) {
        const match = text.match(pattern);
        if (match) {
          // For pattern 1: group 2 is city, group 3 is state
          // For pattern 2: group 1 is city, group 2 is state
          if (pattern.toString().includes("([A-ZÀ-Ú][a-zA-Zà-ú")) {
            const cityPart = match[2] || match[1];
            const statePart = match[3] || match[2];
            if (cityPart && statePart) {
              updates.cidade = `${cityPart.trim()}, ${statePart.trim()}`;
              break;
            }
          }
        }
      }
      // Specific test: "Pinheirinho, Curitiba - PR"
      const specificMatch = text.match(/([A-ZÀ-Ú][a-zA-Zà-ú]+(?:\s[A-ZÀ-Ú][a-zA-Zà-ú]+)*),\s*([A-ZÀ-Ú][a-zA-Zà-ú]+(?:\s[A-ZÀ-Ú][a-zA-Zà-ú]+)*)\s*-\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)/);
      if (specificMatch) {
        // Group 2 = city name, Group 3 = state
        updates.cidade = `${specificMatch[2].trim()} - ${specificMatch[3].trim()}`;
      }
    }

    if (Object.keys(updates).length > 0) {
      await admin.from("pdf_candidates").update(updates).eq("id", cand.id);
      console.log(`Fixed cidade for ${cand.id}: "${updates.cidade}"`);
    }
  }

  console.log("Cidade fix concluido.");
}

run().catch(console.error);
