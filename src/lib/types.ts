export type KanbanStatus = "triado" | "shortlist" | "entrevista" | "oferecido" | "contratado";
export type JobStatus = "active" | "paused" | "completed";
export type AgentStatus = "ativo" | "pausado" | "arquivado";
export type AgentFrequency = "diaria" | "semanal" | "manual";
export type AgentCalibrationDecision = "aprovado" | "rejeitado" | "pulado";
export type AgentCandidateStatus = "novo" | "shortlist" | "rejeitado";

export interface AgentCriterion {
  nome: string;
  peso: number;
  descricao?: string;
  nota?: number;
  justificativa?: string;
}

export interface AgentFilterSet {
  job_titles?: string[];
  localizacao?: string;
  experiencia_minima?: number;
  experiencia_maxima?: number;
  idiomas?: { idioma: string; nivel: string }[];
  keywords?: string[];
  boolean_expression?: string;
}

export interface AgentSummaryMetric {
  analisados: number;
  encontrados: number;
  scoreAlto: number;
  pipeline: number;
}

export interface AgentProfile {
  nome: string;
  cargo: string;
  empresa: string;
  cidade: string;
  resumo: string;
  skills: string[];
  linkedinUrl: string;
  avatarColor?: string;
  isNovo?: boolean;
}

export interface AgentCandidate {
  id: string;
  agenteId: string;
  linkedinUrl: string;
  scoreFinal: number;
  visto: boolean;
  status: AgentCandidateStatus;
  descobertoEm: string;
  nome: string;
  cargo: string;
  empresa: string;
  cidade: string;
  skills: string[];
  chips: string[];
  avatarColor: string;
  initials: string;
  criteriosAvaliacao: AgentCriterion[];
}

export interface AgentRun {
  id: string;
  agenteId: string;
  perfisAnalisados: number;
  candidatosEncontrados: number;
  candidatosScoreAlto: number;
  status: "concluido" | "erro" | "rodando";
  executadoEm: string;
}

export interface Agent {
  id: string;
  empresaId: string;
  vagaId: string;
  nome: string;
  briefing: string;
  status: AgentStatus;
  frequencia: AgentFrequency;
  scoreMinimoNotificacao: number;
  calibracoesRealizadas: number;
  ultimaBusca: string | null;
  proximaBusca: string | null;
  createdAt: string;
  vagaTitulo?: string;
  criteriosIa?: AgentCriterion[];
  filtrosIa?: AgentFilterSet;
  metrics?: AgentSummaryMetric;
  latestRun?: AgentRun | null;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  company: string;
  city: string;
  vagaId?: string;
  score: number;
  avatarColor: string;
  initials: string;
  confirmedTags: string[];
  partialTags: string[];
  otherTags: string[];
  etiqueta?: {
    id: string;
    nome: string;
    cor: string;
    posicao: number;
  } | null;
  shortlist: boolean;
  status: KanbanStatus;
  linkedinUrl: string;
  parsedText?: string;
  observacoes?: string;
  evaluations?: { name: string; score: number; justification: string; manualScore?: number | null; weight?: number }[];
  createdAt?: string;
  // CRM Fields
  email?: string;
  phone?: string;
  pretensaoSalarial?: string;
  disponibilidade?: string;
  regime?: string;
  aiSummary?: string;
  // Campos extraídos pela IA via PDF
  emailContato?: string | null;
  telefone?: string | null;
  cargoAtual?: string | null;
  regimePreferido?: string | null;
  resumoIa?: string | null;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  candidatesCount: number;
  averageScore: number;
  topScore: number;
  status: JobStatus;
  createdDate: string;
  createdAt?: string;
  location?: string;
  contract?: string;
  briefing?: string;
  autoAi?: boolean;
}

export interface UploadFile {
  name: string;
  size: string;
  progress: number;
  status: "ready" | "uploading" | "extracting" | "scoring" | "completed" | "failed";
  storagePath?: string;
}

export type PageId = "dashboard" | "vagas" | "pdf-ranker" | "linkedin" | "agente-ia" | "pipeline" | "candidatos" | "analytics" | "settings";
