import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
] as const;

interface GroqCompletionOptions {
  apiKey: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  response_format?: { type: "json_object" };
}

export async function groqChatCompletion(options: GroqCompletionOptions) {
  const { apiKey, messages, temperature = 0.7, response_format } = options;
  const groq = new Groq({ apiKey });

  let completion = null;
  let lastError: unknown = null;

  for (const model of GROQ_MODELS) {
    try {
      completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        ...(response_format ? { response_format } : {}),
      });
      if (completion) {
        console.log(`[Groq AI] Sucesso com o modelo: ${model}`);
        break;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Groq AI] Falha ao tentar modelo ${model}:`, msg);
      lastError = err;
    }
  }

  if (!completion) {
    throw lastError || new Error("Nenhum modelo da Groq respondeu com sucesso.");
  }

  return completion;
}
