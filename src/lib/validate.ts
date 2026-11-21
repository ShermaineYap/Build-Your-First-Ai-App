import { getScenario, LANGUAGES, type Language, type Scenario } from "./scenarios";
import type { Turn } from "./prompts";
import { detectPii } from "./safety";

export const MAX_TEXT = 400;

export type Parsed =
  | { ok: true; scenario: Scenario; language: Language; history: Turn[] }
  | { ok: false; status: number; error: string; message: string };

/** Validate a request body. The client holds the chat, so the server re-checks everything it is sent. */
export function parseBody(body: unknown, opts: { forTurn: boolean }): Parsed {
  const b = (body ?? {}) as { scenarioId?: unknown; language?: unknown; history?: unknown };
  const scenario = typeof b.scenarioId === "string" ? getScenario(b.scenarioId) : undefined;
  if (!scenario) return { ok: false, status: 400, error: "bad_scenario", message: "Unknown scenario." };
  const language = (LANGUAGES.find((l) => l.id === b.language)?.id ?? "english") as Language;

  if (!Array.isArray(b.history)) return { ok: false, status: 400, error: "bad_history", message: "Missing chat history." };
  const history: Turn[] = [];
  for (const [i, raw] of b.history.entries()) {
    const t = raw as { from?: unknown; text?: unknown };
    const expected = i % 2 === 0 ? "scammer" : "student";
    if (t.from !== expected || typeof t.text !== "string" || !t.text.trim()) {
      return { ok: false, status: 400, error: "bad_history", message: "Chat history is out of order." };
    }
    const text = t.text.slice(0, MAX_TEXT);
    if (expected === "student") {
      const pii = detectPii(text);
      if (pii) return { ok: false, status: 422, error: "pii", message: pii.message };
    }
    history.push({ from: expected, text });
  }

  const scammerCount = history.filter((t) => t.from === "scammer").length;
  if (opts.forTurn) {
    if (scammerCount >= scenario.stages.length) {
      return { ok: false, status: 400, error: "finished", message: "This practice chat has already ended." };
    }
    if (history.length > 0 && history[history.length - 1].from !== "student") {
      return { ok: false, status: 400, error: "bad_history", message: "Reply first, then the recruiter answers." };
    }
  } else if (scammerCount === 0) {
    return { ok: false, status: 400, error: "empty", message: "There's nothing to mark yet." };
  }
  return { ok: true, scenario, language, history };
}
