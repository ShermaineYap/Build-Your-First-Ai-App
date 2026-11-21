import { chat, AllProvidersFailed, hasAnyProvider } from "@/lib/llm";
import { scammerMessages } from "@/lib/prompts";
import { findOutputProblems, sanitizeOutput } from "@/lib/safety";
import { BANK } from "@/lib/scenarios";
import { parseBody } from "@/lib/validate";
import { deviceCookie, deviceLimit, readDeviceCount, tryStartGlobal } from "@/lib/limits";

const BUSY_MESSAGE =
  "The AI is busy right now (free-tier limit). Watch a recorded practice chat instead, or try again later.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseBody(body, { forTurn: true });
  if (!parsed.ok) return Response.json({ error: parsed.error, message: parsed.message }, { status: parsed.status });
  const { scenario, language, history } = parsed;

  if (!hasAnyProvider()) {
    return Response.json({ error: "busy", message: BUSY_MESSAGE }, { status: 503 });
  }

  const headers = new Headers();
  if (history.length === 0) {
    const used = readDeviceCount(request.headers.get("cookie"));
    if (used >= deviceLimit()) {
      return Response.json(
        {
          error: "device_limit",
          message: `You've used today's ${deviceLimit()} live practice chats on this device. Recorded replays are still available.`,
        },
        { status: 429 },
      );
    }
    if (!tryStartGlobal()) {
      return Response.json({ error: "busy", message: BUSY_MESSAGE }, { status: 503 });
    }
    headers.append("Set-Cookie", deviceCookie(used + 1));
  }

  const stageIndex = history.filter((t) => t.from === "scammer").length;
  const messages = scammerMessages(scenario, language, history);
  try {
    let result = await chat(messages);
    let problems = findOutputProblems(result.text);
    let regenerated = false;
    if (problems.length) {
      // One retry usually fixes it; otherwise clean the text deterministically.
      regenerated = true;
      result = await chat(messages, { temperature: 1 });
      problems = findOutputProblems(result.text);
    }
    const clean = problems.length ? sanitizeOutput(result.text, BANK, scenario.accountHolder).text : result.text;
    return Response.json(
      {
        text: clean,
        stageIndex,
        stageId: scenario.stages[stageIndex].id,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        regenerated,
        sanitized: problems.length > 0,
      },
      { headers },
    );
  } catch (e) {
    const details = e instanceof AllProvidersFailed ? e.details : [String(e)];
    console.error("turn failed", details);
    return Response.json({ error: "busy", message: BUSY_MESSAGE }, { status: 503, headers });
  }
}
