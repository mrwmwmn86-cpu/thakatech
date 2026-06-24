export type ChatModel = {
  id: string;
  label: string;
  hint?: string;
};

export const CHAT_MODELS: ChatModel[] = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", hint: "Fast · default" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Strong reasoning" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Balanced" },
  { id: "openai/gpt-5", label: "GPT-5", hint: "Powerful all-rounder" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", hint: "Lower cost" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", hint: "Fastest" },
];

export const DEFAULT_MODEL_ID = CHAT_MODELS[0].id;
export const MODEL_IDS = CHAT_MODELS.map((m) => m.id);
