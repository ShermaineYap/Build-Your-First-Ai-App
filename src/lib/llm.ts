// One OpenAI-compatible client for all providers.
// Free tiers are tight (Groq: 8,000 tokens/minute per model), so load is spread across models:
// chat turns try the big Groq model first; marking tries the small one first. Gemini is the last resort.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Provider {
  name: string;
  base: string;
  model: string;
  key: string | undefined;
  extra?: Record<string, unknown>;
}

export type Route = "chat" | "judge";

const GROQ = "https://api.groq.com/openai/v1";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta/openai";

function providers(route: Route): Provider[] {
  const groqBig: Provider = {
    name: "groq",
    base: GROQ,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    key: process.env.GROQ_API_KEY,
    extra: { reasoning_effort: "low" },
  };
  const groqSmall: Provider = {
    name: "groq",
    base: GROQ,
    model: process.env.GROQ_MODEL_SMALL || "openai/gpt-oss-20b",
    key: process.env.GROQ_API_KEY,
    extra: { reasoning_effort: "low" },
  };
  const gemini: Provider = {
    name: "gemini",
    base: GEMINI,
    model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    key: process.env.GEMINI_API_KEY,
  };
  const order = route === "judge" ? [groqSmall, groqBig, gemini] : [groqBig, groqSmall, gemini];
  return order.filter((p) => p.key);
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
  return providers("chat").length > 0;
}

class RateLimited extends Error {
  constructor(message: string, public retryAfterS: number) {
    super(message);
  }
}

/** Seconds to wait from a Retry-After header or a Groq "try again in 2.5s" message; Infinity if unknown. */
export function parseRetryAfter(header: string | null, body: string): number {
  const h = Number(header);
  if (header && Number.isFinite(h)) return h;
  const m = body.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
  if (m) return Number(m[1] ?? 0) * 60 + Number(m[2]);
  return Infinity;
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
    ...p.extra,
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
      const errText = (await res.text()).slice(0, 300);
      if (res.status === 429) {
        throw new RateLimited(`${p.model} 429`, parseRetryAfter(res.headers.get("retry-after"), errText));
      }
      throw new Error(`${p.model} ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const text: string = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error(`${p.model}: empty response`);
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

const MAX_WAIT_S = 6;

/** Try each provider in order. A short rate-limit wait is retried once on the same model; otherwise move on. */
export async function chat(
  messages: ChatMessage[],
  opts: { route?: Route; temperature?: number; maxTokens?: number; json?: boolean; timeoutMs?: number } = {},
): Promise<ChatResult> {
  const o = { temperature: opts.temperature ?? 0.8, maxTokens: opts.maxTokens ?? 700, json: opts.json ?? false };
  const errors: string[] = [];
  for (const p of providers(opts.route ?? "chat")) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await callOnce(p, messages, o, opts.timeoutMs ?? 20000);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
        if (e instanceof RateLimited && attempt === 0 && e.retryAfterS <= MAX_WAIT_S) {
          await new Promise((r) => setTimeout(r, Math.ceil(e.retryAfterS * 1000) + 250));
          continue;
        }
        break;
      }
    }
  }
  throw new AllProvidersFailed(errors);
}
