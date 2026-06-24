import { callAI } from "./src/lib/ai-client";
import { buildScoringPrompt, Criteria } from "./src/lib/scoring-prompt";
import * as fs from "fs";

// CV fictício para teste
const fakeCV = `
Nome: Rafael Alves
Local: Rio de Janeiro, RJ
Cargo Atual: Email Designer Especialista

Resumo:
Mais de 5 anos de experiência criando templates de email marketing focados em conversão. Domínio absoluto de Figma para criar designs system de newsletters e campanhas de CRM. 
Trabalhei recentemente na Agência XYZ disparando e-mails semanais usando HTML customizado.

Idiomas:
- Português: Nativo
- Inglês: Avançado (Consigo ler, escrever e conduzir reuniões em inglês com clientes)

Ferramentas:
- Figma
- Adobe Photoshop
- Mailchimp / Brevo
`;

// Critérios de avaliação
const criteria: Criteria[] = [
  { name: "Figma", weight: 5 },
  { name: "Email Marketing", weight: 4 },
  { name: "Inglês", weight: 3 },
  { name: "React / HTML", weight: 2 }, // Exemplo de critério parcialmente atendido
  { name: "Salesforce", weight: 3 } // Exemplo de critério não mencionado
];

async function runTest() {
  console.log("🛠 Construindo o prompt de avaliação...");
  const prompt = buildScoringPrompt(fakeCV, criteria);
  
  console.log("🤖 Enviando para OpenRouter (Qwen3 grátis)...");
  
  try {
    const jsonString = await callAI(prompt);
    console.log("\n📦 Resposta bruta recebida:");
    console.log(jsonString);
    
    console.log("\n✅ Validando se o JSON é válido...");
    const parsedData = JSON.parse(jsonString);
    
    console.log("\n✨ JSON Parse realizado com sucesso! Dados extraídos:");
    console.dir(parsedData, { depth: null, colors: true });

  } catch (error) {
    console.error("\n❌ Erro durante o teste:");
    console.error(error);
  }
}

runTest();
