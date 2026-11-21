// One OpenAI-compatible client for both providers. Groq first, Gemini as fallback.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Provider {
  name: string;
  base: string;
  model: string;
  key: string | undefined;
}

function providers(): Provider[] {
  return [
    {
      name: "groq",
      base: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      key: process.env.GROQ_API_KEY,
    },
    {
      name: "gemini",
      base: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
      key: process.env.GEMINI_API_KEY,
    },
  ].filter((p) => p.key);
}

export interface ChatResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokens: number;
}

export class AllProvidersFailed extends Error {
  constructor(public details: string[]) {
    super("All AI providers are busy or unavailable");
  }
}

export function hasAnyProvider(): boolean {
  return providers().length > 0;
}

async function callOnce(
  p: Provider,
  messages: ChatMessage[],
  opts: { temperature: number; maxTokens: number; json: boolean },
  timeoutMs: number,
): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: p.model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  };
  if (opts.json) body.response_format = { type: "json_object" };
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${p.base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 200);
      throw new Error(`${p.name} ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const text: string = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error(`${p.name}: empty response`);
    return {
      text,
      provider: p.name,
      model: p.model,
      latencyMs: Date.now() - t0,
      tokens: data?.usage?.total_tokens ?? 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Try each configured provider in order; move on after an error, rate limit or timeout. */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; json?: boolean; timeoutMs?: number } = {},
): Promise<ChatResult> {
  const o = { temperature: opts.temperature ?? 0.8, maxTokens: opts.maxTokens ?? 1500, json: opts.json ?? false };
  const errors: string[] = [];
  for (const p of providers()) {
    try {
      return await callOnce(p, messages, o, opts.timeoutMs ?? 20000);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new AllProvidersFailed(errors);
}
