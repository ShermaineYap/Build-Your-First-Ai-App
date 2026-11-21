import type { Turn } from "./prompts";
import type { Scenario } from "./scenarios";

export type Verdict = "refused" | "questioned" | "complied" | "neutral";

export interface JudgeOutput {
  flags: { turn: number; quote: string }[];
  replies: { turn: number; verdict: Verdict; note: string }[];
}

const VERDICTS: Verdict[] = ["refused", "questioned", "complied", "neutral"];

// One-to-one character folding, so an index in the folded text is the same index in the original.
function fold(text: string): string {
  return text
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\u00A0/g, " ")
    .toLowerCase();
}

/** Find the judge's quote in the message, tolerating quote/dash/case differences. Returns the original span or "". */
export function locateQuote(message: string, quote: string): string {
  if (!quote) return "";
  if (message.includes(quote)) return quote;
  const i = fold(message).indexOf(fold(quote));
  return i >= 0 ? message.slice(i, i + quote.length) : "";
}

/** Parse and validate the judge's JSON. Quotes that aren't exact substrings are dropped, so a highlight is never invented. */
export function parseJudge(raw: string, history: Turn[]): JudgeOutput {
  let data: unknown;
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    data = JSON.parse(m ? m[0] : raw);
  } catch {
    return { flags: [], replies: [] };
  }
  const obj = (data ?? {}) as { flags?: unknown; replies?: unknown };
  const scammer = history.filter((t) => t.from === "scammer").map((t) => t.text);
  const studentCount = history.filter((t) => t.from === "student").length;

  const flags = (Array.isArray(obj.flags) ? obj.flags : [])
    .map((f) => f as { turn?: unknown; quote?: unknown })
    .filter((f) => Number.isInteger(f.turn) && typeof f.quote === "string")
    .map((f) => ({ turn: f.turn as number, quote: (f.quote as string).trim() }))
    .filter((f) => f.turn >= 1 && f.turn <= scammer.length)
    .map((f) => ({ ...f, quote: locateQuote(scammer[f.turn - 1], f.quote) }));

  const replies = (Array.isArray(obj.replies) ? obj.replies : [])
    .map((r) => r as { turn?: unknown; verdict?: unknown; note?: unknown })
    .filter((r) => Number.isInteger(r.turn) && VERDICTS.includes(r.verdict as Verdict))
    .map((r) => ({
      turn: r.turn as number,
      verdict: r.verdict as Verdict,
      note: typeof r.note === "string" ? r.note.slice(0, 140) : "",
    }))
    .filter((r) => r.turn >= 1 && r.turn <= Math.max(studentCount, scammer.length));

  return { flags, replies };
}

export interface ScoreResult {
  score: number;
  label: string;
  walkedAwayAfter: number | null; // recruiter messages seen before walking away
  flagsSeen: number;
  flagsQuestioned: number;
  complied: { turn: number; stageId: string }[];
  breakdown: { reason: string; points: number }[];
}

const WALK_POINTS = [100, 95, 85, 70, 55];
const NEVER_LEFT = 30;
const MONEY_STAGES = new Set(["top_up", "pressure"]);

/**
 * Deterministic score. The model only labels replies; the points are ours, so the same chat
 * always gets the same score and the rules can be shown to the student.
 */
export function scoreSession(s: Scenario, history: Turn[], walkedAway: boolean, judge: JudgeOutput): ScoreResult {
  const seen = history.filter((t) => t.from === "scammer").length;
  const breakdown: { reason: string; points: number }[] = [];

  let score: number;
  if (walkedAway && seen >= 1) {
    score = WALK_POINTS[Math.min(seen, WALK_POINTS.length) - 1];
    breakdown.push({ reason: `Walked away after message ${seen} of ${s.stages.length}`, points: score });
  } else {
    score = NEVER_LEFT;
    breakdown.push({ reason: "Stayed in the chat to the end", points: score });
  }

  const complied: { turn: number; stageId: string }[] = [];
  for (const r of judge.replies) {
    if (r.verdict !== "complied") continue;
    const stageId = s.stages[r.turn - 1]?.id ?? "unknown";
    complied.push({ turn: r.turn, stageId });
    const penalty = MONEY_STAGES.has(stageId) ? 25 : 10;
    breakdown.push({ reason: `Went along with message ${r.turn}`, points: -penalty });
    score -= penalty;
  }

  const questioned = new Set(
    judge.replies.filter((r) => r.verdict === "questioned" || r.verdict === "refused").map((r) => r.turn),
  );
  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 85 ? "Walked away clean" : score >= 60 ? "Got out, but late" : "This one would have cost you";

  return {
    score,
    label,
    walkedAwayAfter: walkedAway ? seen : null,
    flagsSeen: seen,
    flagsQuestioned: questioned.size,
    complied,
    breakdown,
  };
}
