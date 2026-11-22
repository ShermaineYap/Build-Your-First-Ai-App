import { describe, expect, it } from "vitest";
import { detectPii, findOutputProblems, sanitizeOutput } from "@/lib/safety";
import { locateQuote, parseJudge, scoreSession } from "@/lib/score";
import { parseBody } from "@/lib/validate";
import { scammerMessages } from "@/lib/prompts";
import { getScenario, SCENARIOS } from "@/lib/scenarios";
import type { Turn } from "@/lib/prompts";

const s = getScenario("like_share")!;
const chat = (n: number, withLastReply = true): Turn[] => {
  const h: Turn[] = [];
  for (let i = 0; i < n; i++) {
    h.push({ from: "scammer", text: `msg ${i + 1} top up RM100 now` });
    if (i < n - 1 || withLastReply) h.push({ from: "student", text: `reply ${i + 1}` });
  }
  return h;
};

describe("detectPii", () => {
  it.each([
    ["my ic 990101-14-5678", "ic"],
    ["990101145678", "ic"],
    ["call me 012-345 6789", "phone"],
    ["+60 12-3456789", "phone"],
    ["acc 1234567890", "account"],
    ["me@student.apu.edu.my", "email"],
    ["password: hunter22", "secret"],
  ])("flags %s", (text, kind) => {
    expect(detectPii(text)?.kind).toBe(kind);
  });
  it.each(["ok can, how much?", "RM100 ah?", "XXXX", "I need 15 minutes", "8888-XXXX"])("allows %s", (text) => {
    expect(detectPii(text)).toBeNull();
  });
});

describe("output filter", () => {
  it("finds real banks, people, links and meta-text", () => {
    expect(findOutputProblems("bank in to Maybank 123")).toContain("real_bank");
    expect(findOutputProblems("A/C: Siti Nurhaliza")).toContain("real_person");
    expect(findOutputProblems("join t.me/freetask")).toContain("link");
    expect(findOutputProblems("As an AI I can't help")).toContain("meta");
    expect(findOutputProblems("Top up RM100 to Bank Seri Murni 8888-1234-5678")).toEqual([]);
  });
  it("does not flag the verb 'grab'", () => {
    expect(findOutputProblems("grab this slot now!")).toEqual([]);
  });
  it("sanitizes as a last resort", () => {
    const out = sanitizeOutput("Pay to CIMB, A/C Siti Nurhaliza, t.me/x", "Bank Seri Murni", "Lee Mei Fong").text;
    expect(out).toBe("Pay to Bank Seri Murni, A/C Lee Mei Fong, [link]");
  });
});

describe("parseBody", () => {
  it("accepts an empty chat for the first turn", () => {
    const r = parseBody({ scenarioId: "like_share", language: "campur", history: [] }, { forTurn: true });
    expect(r.ok).toBe(true);
  });
  it("rejects out-of-order history", () => {
    const r = parseBody({ scenarioId: "like_share", history: [{ from: "student", text: "hi" }] }, { forTurn: true });
    expect(r.ok).toBe(false);
  });
  it("rejects real personal data server-side too", () => {
    const r = parseBody(
      { scenarioId: "fee_recruiter", history: [{ from: "scammer", text: "IC please" }, { from: "student", text: "990101-14-5678" }] },
      { forTurn: true },
    );
    expect(r.ok === false && r.error).toBe("pii");
  });
  it("refuses a sixth recruiter turn", () => {
    const r = parseBody({ scenarioId: "like_share", history: chat(5) }, { forTurn: true });
    expect(r.ok === false && r.error).toBe("finished");
  });
  it("unknown language falls back to English", () => {
    const r = parseBody({ scenarioId: "like_share", language: "klingon", history: [] }, { forTurn: true });
    expect(r.ok && r.language).toBe("english");
  });
});

describe("stage machine", () => {
  it("picks the stage from the number of recruiter messages, not from the model", () => {
    for (let n = 0; n < 5; n++) {
      const sys = scammerMessages(s, "english", chat(n))[0].content;
      expect(sys).toContain(`CURRENT STAGE (${n + 1} of 5): ${s.stages[n].id}`);
    }
  });
  it("every scenario has five stages in the same order", () => {
    for (const sc of SCENARIOS) {
      expect(sc.stages.map((x) => x.id)).toEqual(["hook", "trust", "small_payout", "top_up", "pressure"]);
      expect(sc.sampleReplies).toHaveLength(5);
    }
  });
});

describe("parseJudge", () => {
  const h = chat(2);
  it("keeps exact quotes and drops invented ones", () => {
    const j = parseJudge(
      JSON.stringify({
        flags: [{ turn: 1, quote: "top up RM100" }, { turn: 2, quote: "something not in the text" }],
        replies: [{ turn: 1, verdict: "questioned", note: "Good question." }],
      }),
      h,
    );
    expect(j.flags).toEqual([{ turn: 1, quote: "top up RM100" }, { turn: 2, quote: "" }]);
    expect(j.replies[0].verdict).toBe("questioned");
  });
  it("survives junk", () => {
    expect(parseJudge("not json", h)).toEqual({ flags: [], replies: [] });
    expect(parseJudge('{"replies":[{"turn":1,"verdict":"maybe"}]}', h).replies).toEqual([]);
  });
});

describe("scoreSession", () => {
  const none = { flags: [], replies: [] };
  it("rewards walking away early", () => {
    expect(scoreSession(s, chat(1, false), true, none).score).toBe(100);
    expect(scoreSession(s, chat(4, false), true, none).score).toBe(70);
  });
  it("staying to the end scores low", () => {
    const r = scoreSession(s, chat(5), false, none);
    expect(r.score).toBe(30);
    expect(r.walkedAwayAfter).toBeNull();
  });
  it("penalises agreeing to pay more than agreeing to chat", () => {
    const j = {
      flags: [],
      replies: [
        { turn: 2, verdict: "complied" as const, note: "" },
        { turn: 4, verdict: "complied" as const, note: "" },
      ],
    };
    const r = scoreSession(s, chat(4), true, j);
    expect(r.score).toBe(70 - 10 - 25);
    expect(r.label).toBe("This one would have cost you");
  });
  it("is deterministic and bounded", () => {
    const j = { flags: [], replies: [1, 2, 3, 4, 5].map((t) => ({ turn: t, verdict: "complied" as const, note: "" })) };
    expect(scoreSession(s, chat(5), false, j).score).toBe(0);
  });
});

describe("locateQuote", () => {
  it("matches across curly quotes, odd dashes and case, returning the original text", () => {
    const msg = "We need RM250 \u201cregistration & laptop deposit\u201d to 8888\u20111234";
    expect(locateQuote(msg, '"registration & laptop deposit"')).toBe("\u201cregistration & laptop deposit\u201d");
    expect(locateQuote(msg, "to 8888-1234")).toBe("to 8888\u20111234");
    expect(locateQuote(msg, "WE NEED")).toBe("We need");
    expect(locateQuote(msg, "not here")).toBe("");
  });
});

import { SET_A, SET_B, resultCode, parseResultCode, scoreQuiz } from "@/lib/quiz";

describe("study quiz", () => {
  it("has two matched sets of 5 scams and 3 legit", () => {
    for (const set of [SET_A, SET_B]) {
      expect(set).toHaveLength(8);
      expect(set.filter((i) => i.scam)).toHaveLength(5);
    }
    const ids = [...SET_A, ...SET_B].map((i) => i.id);
    expect(new Set(ids).size).toBe(16);
  });
  it("uses no real banks, brands or links", () => {
    for (const i of [...SET_A, ...SET_B]) expect(findOutputProblems(i.text).filter((p) => p !== "meta")).toEqual([]);
  });
  it("scores answers", () => {
    const all = Object.fromEntries(SET_A.map((i) => [i.id, i.scam]));
    expect(scoreQuiz(SET_A, all)).toBe(8);
    expect(scoreQuiz(SET_A, {})).toBe(0);
  });
  it("makes codes that parse back", () => {
    const code = resultCode("BA", 5, 7, () => 0);
    expect(code).toBe("SS-BA-5-7-AAA");
    expect(parseResultCode(code.toLowerCase())).toEqual({ order: "BA", before: 5, after: 7 });
    expect(parseResultCode("SS-AB-9-1-XYZ")).toBeNull();
  });
});

import { parseRetryAfter } from "@/lib/llm";

describe("parseRetryAfter", () => {
  it("reads headers and Groq's message format", () => {
    expect(parseRetryAfter("3", "")).toBe(3);
    expect(parseRetryAfter(null, "Please try again in 2.75s. Need more tokens?")).toBe(2.75);
    expect(parseRetryAfter(null, "Please try again in 1m30.5s.")).toBe(90.5);
    expect(parseRetryAfter(null, "quota exceeded")).toBe(Infinity);
  });
});

describe("account placeholders", () => {
  it("are flagged and filled in", () => {
    expect(findOutputProblems("Bank Seri Murni, 8888-XXXX-XXXX")).toContain("placeholder");
    expect(sanitizeOutput("ke 8888-XXXX-XXXX ya", "Bank Seri Murni", "Lee").text).toBe("ke 8888-4821-7730 ya");
  });
});
