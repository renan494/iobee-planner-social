// Configuração de modelos de IA por tarefa.
// Persistido em localStorage. Cada tarefa pode usar um modelo diferente.

export type AITaskKey =
  | "strategy"        // Geração de estratégia digital
  | "debate"          // Debate sobre a estratégia
  | "copy"            // Geração de copy por framework
  | "analyzeAd"       // Engenharia reversa de anúncio (texto)
  | "reverseCopy"     // Engenharia reversa de Reels/posts
  | "generatePost";   // Geração de post individual / em lote

export interface AIModelOption {
  id: string;
  label: string;
  provider: "OpenAI" | "Google";
  cost: 1 | 2 | 3 | 4 | 5; // 1 = mais barato, 5 = mais caro
  speed: 1 | 2 | 3 | 4 | 5; // 1 = mais lento, 5 = mais rápido
  quality: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: "openai/gpt-5.2",
    label: "GPT-5.2",
    provider: "OpenAI",
    cost: 5,
    speed: 2,
    quality: 5,
    description: "Mais novo da OpenAI. Raciocínio aprimorado. Ideal para estratégia e análise complexa.",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    cost: 4,
    speed: 3,
    quality: 5,
    description: "All-rounder de alta qualidade. Excelente para nuance e contexto longo.",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 mini",
    provider: "OpenAI",
    cost: 3,
    speed: 4,
    quality: 4,
    description: "Equilíbrio entre custo e qualidade. Bom para a maioria dos casos.",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 nano",
    provider: "OpenAI",
    cost: 2,
    speed: 5,
    quality: 3,
    description: "Rápido e barato. Para tarefas simples em volume.",
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    cost: 4,
    speed: 3,
    quality: 5,
    description: "Forte em multimodal e contexto enorme. Ótimo para análise.",
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    provider: "Google",
    cost: 2,
    speed: 5,
    quality: 4,
    description: "Rápido e econômico. Ótimo custo-benefício para geração em lote.",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    cost: 2,
    speed: 5,
    quality: 4,
    description: "Versão estável do Flash. Muito rápida.",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "Google",
    cost: 1,
    speed: 5,
    quality: 2,
    description: "O mais barato. Use para classificação e tarefas simples.",
  },
];

export const AI_TASKS: { key: AITaskKey; label: string; description: string; recommended: string }[] = [
  {
    key: "strategy",
    label: "Estratégia digital",
    description: "Documento completo de estratégia gerado para cada cliente",
    recommended: "openai/gpt-5.2",
  },
  {
    key: "debate",
    label: "Debate da estratégia",
    description: "Chat com a IA para questionar e ajustar a estratégia",
    recommended: "openai/gpt-5.2",
  },
  {
    key: "copy",
    label: "Copy por framework",
    description: "Geração de copy usando AIDA, PAS, etc.",
    recommended: "openai/gpt-5.2",
  },
  {
    key: "analyzeAd",
    label: "Engenharia reversa de anúncio",
    description: "Adaptar copy de anúncios para sua marca",
    recommended: "openai/gpt-5.2",
  },
  {
    key: "reverseCopy",
    label: "Engenharia reversa de Reels/Posts",
    description: "Analisar e gerar variações de criativos",
    recommended: "openai/gpt-5.2",
  },
  {
    key: "generatePost",
    label: "Geração de post (calendário)",
    description: "Posts individuais e em lote no calendário/CreatePost",
    recommended: "google/gemini-3-flash-preview",
  },
];

const STORAGE_KEY = "iobee:ai-models:v1";
const DEFAULT_MODEL = "openai/gpt-5.2";

export function getAllAIModelChoices(): Record<AITaskKey, string> {
  if (typeof window === "undefined") {
    return Object.fromEntries(AI_TASKS.map((t) => [t.key, DEFAULT_MODEL])) as Record<AITaskKey, string>;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.fromEntries(
      AI_TASKS.map((t) => [t.key, typeof parsed[t.key] === "string" ? parsed[t.key] : DEFAULT_MODEL]),
    ) as Record<AITaskKey, string>;
  } catch {
    return Object.fromEntries(AI_TASKS.map((t) => [t.key, DEFAULT_MODEL])) as Record<AITaskKey, string>;
  }
}

export function getAIModel(task: AITaskKey): string {
  return getAllAIModelChoices()[task] || DEFAULT_MODEL;
}

export function setAIModel(task: AITaskKey, model: string) {
  const all = getAllAIModelChoices();
  all[task] = model;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  // dispara um evento simples para componentes que queiram reagir
  window.dispatchEvent(new CustomEvent("ai-models-changed", { detail: all }));
}

export function resetAIModels() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("ai-models-changed"));
}
