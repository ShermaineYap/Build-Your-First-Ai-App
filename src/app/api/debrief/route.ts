import { chat, hasAnyProvider } from "@/lib/llm";
import { judgeMessages } from "@/lib/prompts";
import { parseJudge, scoreSession, type JudgeOutput } from "@/lib/score";
import { parseBody } from "@/lib/validate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseBody(body, { forTurn: false });
  if (!parsed.ok) return Response.json({ error: parsed.error, message: parsed.message }, { status: parsed.status });
  const { scenario, history } = parsed;
  const walkedAway = Boolean((body as { walkedAway?: unknown }).walkedAway);

  let judge: JudgeOutput = { flags: [], replies: [] };
  let marked = false;
  let provider: string | null = null;
  let model: string | null = null;
  if (hasAnyProvider()) {
    try {
      const res = await chat(judgeMessages(scenario, history), {
        route: "judge",
        temperature: 0,
        json: true,
        maxTokens: 2000,
        maxWaitS: 20,
        timeoutMs: 45000,
      });
      judge = parseJudge(res.text, history);
      marked = judge.flags.length > 0 || judge.replies.length > 0;
      provider = res.provider;
      model = res.model;
    } catch (e) {
      console.error("debrief judge failed", e);
    }
  }

  const score = scoreSession(scenario, history, walkedAway, judge);
  return Response.json({ judge, score, marked, provider, model });
}
