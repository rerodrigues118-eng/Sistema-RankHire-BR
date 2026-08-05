import { z } from "zod";

export const CandidateStatusSchema = z.enum(["triado", "shortlist", "entrevista", "oferecido", "contratado"]);

export const UpdateCandidateSchema = z.object({
  status: CandidateStatusSchema.optional(),
  shortlist: z.boolean().optional(),
  name: z.string().min(1).max(150).optional(),
  role: z.string().max(150).optional(),
  company: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  aiSummary: z.string().max(2000).optional(),
  observacoes: z.string().max(2000).optional(),
});

export const LgpdForgetSchema = z.object({
  candidateId: z.string().uuid().or(z.string().min(5)),
  reason: z.string().min(3).max(500),
  confirmPurge: z.literal(true, {
    message: "Confirmação explícita do expurgo de dados é obrigatória por LGPD.",
  }),
});

export const AiScoringSchema = z.object({
  candidateId: z.string().min(1),
  vagaId: z.string().min(1),
  customCriteria: z.array(
    z.object({
      nome: z.string().min(1),
      peso: z.number().min(1).max(10),
      descricao: z.string().optional(),
    })
  ).optional(),
});
