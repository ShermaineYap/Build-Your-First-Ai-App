"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPii } from "@/lib/safety";
import { MAX_TEXT } from "@/lib/validate";
import type { Debrief, LanguageView, Replay, ScenarioView, Turn, Language } from "./types";
import s from "./App.module.css";

type View = "home" | "chat" | "debrief";

interface Props {
  scenarios: ScenarioView[];
  languages: LanguageView[];
  replays: Replay[];
}

export default function App({ scenarios, languages, replays }: Props) {
  const [view, setView] = useState<View>("home");
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [language, setLanguage] = useState<Language>("campur");
  const [history, setHistory] = useState<Turn[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walkedAway, setWalkedAway] = useState(false);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [replay, setReplay] = useState<Replay | null>(null);

  const scenario = scenarios.find((x) => x.id === scenarioId)!;

  const requestTurn = useCallback(
    async (h: Turn[]) => {
      setWaiting(true);
      setError(null);
      try {
        const res = await fetch("/api/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId, language, history: h }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? "Something went wrong. Try again.");
          return;
        }
        setHistory([...h, { from: "scammer", text: data.text }]);
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setWaiting(false);
      }
    },
    [scenarioId, language],
  );

  const startLive = () => {
    setReplay(null);
    setHistory([]);
    setWalkedAway(false);
    setDebrief(null);
    setView("chat");
    void requestTurn([]);
  };

  const startReplay = (r: Replay) => {
    setReplay(r);
    setScenarioId(r.scenarioId);
    setLanguage(r.language);
    setHistory([]);
    setWalkedAway(r.walkedAway);
    setDebrief(null);
    setError(null);
    setView("chat");
  };

  const finish = async (h: Turn[], walked: boolean) => {
    setWalkedAway(walked);
    setView("debrief");
    window.scrollTo({ top: 0 });
    if (replay) {
      setHistory(replay.history);
      setDebrief(replay.debrief);
      return;
    }
    setDebrief(null);
    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, language, history: h, walkedAway: walked }),
      });
      const data = await res.json();
      if (res.ok) setDebrief({ judge: data.judge, score: data.score, marked: data.marked });
      else setError(data.message ?? "Couldn't mark this chat.");
    } catch {
      setError("Couldn't reach the server to mark this chat.");
    }
  };

  const send = (text: string) => {
    const h: Turn[] = [...history, { from: "student", text }];
    setHistory(h);
    const recruiterCount = h.filter((t) => t.from === "scammer").length;
    if (recruiterCount >= scenario.stages.length) void finish(h, false);
    else void requestTurn(h);
  };

  const goHome = () => {
    setView("home");
    setReplay(null);
    setError(null);
  };

  return (
    <main className={s.page}>
      {view === "home" && (
        <Home
          scenarios={scenarios}
          languages={languages}
          replays={replays}
          scenarioId={scenarioId}
          language={language}
          onScenario={setScenarioId}
          onLanguage={setLanguage}
          onStart={startLive}
          onReplay={startReplay}
        />
      )}
      {view === "chat" && (
        <Chat
          scenario={scenario}
          history={history}
          waiting={waiting}
          error={error}
          replay={replay}
          replays={replays}
          onSend={send}
          onWalkAway={() => void finish(history, true)}
          onReplayDone={(h) => void finish(h, replay?.walkedAway ?? false)}
          onReplayStep={setHistory}
          onBack={goHome}
          onRetry={() => void requestTurn(history)}
          onWatchReplay={startReplay}
        />
      )}
      {view === "debrief" && (
        <DebriefView
          scenario={scenario}
          history={history}
          walkedAway={walkedAway}
          debrief={debrief}
          error={error}
          isReplay={Boolean(replay)}
          onAgain={startLive}
          onHome={goHome}
        />
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- Home */

function Home(props: {
  scenarios: ScenarioView[];
  languages: LanguageView[];
  replays: Replay[];
  scenarioId: string;
  language: Language;
  onScenario: (id: string) => void;
  onLanguage: (l: Language) => void;
  onStart: () => void;
  onReplay: (r: Replay) => void;
}) {
  return (
    <div className={s.home}>
      <header className={s.masthead}>
        <h1 className={s.wordmark}>ScamSparring</h1>
        <p className={s.lede}>Practise walking away from a job scam before a real one finds you.</p>
      </header>

      <p className={s.context}>
        Malaysians lost about RM222 million to part-time job scams in 2025, more than double the year before (
        <a href="https://www.thestar.com.my/news/nation/2026/01/10/cops-no-fees-for-job-applications" target="_blank" rel="noreferrer">
          PDRM via The Star
        </a>
        ). Hundreds of the victims were students. Here an AI plays the recruiter. You chat, decide when to walk
        away, and then see your chat marked in red pen.
      </p>

      <fieldset className={s.choices}>
        <legend className={s.legend}>Pick a scam to practise against</legend>
        {props.scenarios.map((sc) => (
          <label key={sc.id} className={s.choice} data-selected={sc.id === props.scenarioId}>
            <input
              type="radio"
              name="scenario"
              value={sc.id}
              checked={sc.id === props.scenarioId}
              onChange={() => props.onScenario(sc.id)}
            />
            <span className={s.choiceTitle}>{sc.title}</span>
            <span className={s.choiceBlurb}>{sc.blurb}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className={s.langRow}>
        <legend className={s.legend}>The recruiter writes in</legend>
        <div className={s.segmented}>
          {props.languages.map((l) => (
            <label key={l.id} data-selected={l.id === props.language}>
              <input
                type="radio"
                name="language"
                value={l.id}
                checked={l.id === props.language}
                onChange={() => props.onLanguage(l.id)}
              />
              {l.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={s.actions}>
        <button className={s.primary} onClick={props.onStart}>
          Start practice chat
        </button>
      </div>

      {props.replays.length > 0 && (
        <section className={s.replays}>
          <h2 className={s.h2}>Or watch a recorded chat</h2>
          <p className={s.small}>Real AI chats recorded earlier, with the marking. These don&rsquo;t use any AI quota.</p>
          <ul className={s.replayList}>
            {props.replays.map((r) => (
              <li key={r.id}>
                <button className={s.linkButton} onClick={() => props.onReplay(r)}>
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className={s.footer}>
        <p>
          Everything here is fictional: the companies, people and &ldquo;Bank Seri Murni&rdquo;. Nothing you type is
          saved. Never type real details, even here.
        </p>
        <p>
          Got a real message like this? Check the number or account at{" "}
          <a href="https://semakmule.rmp.gov.my/" target="_blank" rel="noreferrer">
            Semak Mule
          </a>
          . Already sent money? Call the National Scam Response Centre on <a href="tel:997">997</a> straight away.
        </p>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- Chat */

function Chat(props: {
  scenario: ScenarioView;
  history: Turn[];
  waiting: boolean;
  error: string | null;
  replay: Replay | null;
  replays: Replay[];
  onSend: (t: string) => void;
  onWalkAway: () => void;
  onReplayDone: (h: Turn[]) => void;
  onReplayStep: (h: Turn[]) => void;
  onBack: () => void;
  onRetry: () => void;
  onWatchReplay: (r: Replay) => void;
}) {
  const { scenario, history, replay } = props;
  const [draft, setDraft] = useState("");
  const [pii, setPii] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // In a replay, show "typing" while the next recorded message is the recruiter's.
  const replayTyping = Boolean(
    replay && history.length < replay.history.length && replay.history[history.length].from === "scammer",
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length, props.waiting, replayTyping]);

  // Replay: reveal one message at a time, at a readable pace.
  useEffect(() => {
    if (!replay) return;
    if (history.length >= replay.history.length) {
      const t = setTimeout(() => props.onReplayDone(replay.history), 1400);
      return () => clearTimeout(t);
    }
    const next = replay.history[history.length];
    const delay = next.from === "scammer" ? 1300 + Math.min(next.text.length * 8, 1700) : 1500;
    const t = setTimeout(() => {
      props.onReplayStep(replay.history.slice(0, history.length + 1));
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay, history.length]);

  const recruiterCount = history.filter((t) => t.from === "scammer").length;
  const canReply = !replay && !props.waiting && history.length > 0 && history[history.length - 1].from === "scammer";
  const lastMessage = recruiterCount >= scenario.stages.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canReply) return;
    const found = detectPii(text);
    if (found) {
      setPii(found.message);
      return;
    }
    setPii(null);
    setDraft("");
    props.onSend(text);
  };

  const busyReplay = props.replays.find((r) => r.scenarioId === scenario.id) ?? props.replays[0];

  return (
    <div className={s.chatWrap}>
      <div className={s.chatTop}>
        <button className={s.textButton} onClick={props.onBack}>
          Back
        </button>
        <div className={s.contact}>
          <span className={s.contactName}>{scenario.contactName}</span>
          <span className={s.contactCo}>{scenario.company}</span>
        </div>
        <span className={s.practiceTag}>{replay ? "Recorded chat" : "Practice chat"}</span>
      </div>

      <div className={s.thread} aria-live="polite">
        {history.map((t, i) => (
          <div key={i} className={t.from === "scammer" ? s.them : s.me}>
            {t.text}
          </div>
        ))}
        {(props.waiting || replayTyping) && (
          <div className={`${s.them} ${s.typing}`} aria-label={`${scenario.contactName} is typing`}>
            <span />
            <span />
            <span />
          </div>
        )}
        {props.error && (
          <div className={s.chatError} role="alert">
            <p>{props.error}</p>
            <div className={s.errorActions}>
              <button className={s.secondary} onClick={props.onRetry}>
                Try again
              </button>
              {busyReplay && (
                <button className={s.secondary} onClick={() => props.onWatchReplay(busyReplay)}>
                  Watch a recorded chat
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={s.composer}>
        {replay ? (
          <div className={s.replayBar}>
            <span className={s.small}>Playing a recorded chat.</span>
            <button className={s.secondary} onClick={() => props.onReplayDone(replay.history)}>
              Skip to the marking
            </button>
          </div>
        ) : (
          <>
            {lastMessage && canReply && (
              <p className={s.small}>Last message. Reply once more, or walk away.</p>
            )}
            <form className={s.replyForm} onSubmit={submit}>
              <label className={s.srOnly} htmlFor="reply">
                Your reply
              </label>
              <textarea
                id="reply"
                value={draft}
                maxLength={MAX_TEXT}
                rows={2}
                placeholder={canReply ? "Reply like you normally would" : "Wait for the reply"}
                disabled={!canReply}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (pii) setPii(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) submit(e);
                }}
              />
              <button className={s.send} type="submit" disabled={!canReply || !draft.trim()}>
                Send
              </button>
            </form>
            {pii && (
              <p className={s.piiWarning} role="alert">
                {pii}
              </p>
            )}
            <button className={s.walkAway} onClick={props.onWalkAway} disabled={history.length === 0}>
              Walk away
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Debrief */

function Marked({ text, quote }: { text: string; quote: string }) {
  if (!quote) return <>{text}</>;
  const i = text.indexOf(quote);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.penMark}>{quote}</mark>
      {text.slice(i + quote.length)}
    </>
  );
}

const VERDICT_MARK: Record<string, { sign: string; tone: "good" | "bad" | "plain" }> = {
  refused: { sign: "✓", tone: "good" },
  questioned: { sign: "✓", tone: "good" },
  complied: { sign: "✗", tone: "bad" },
  neutral: { sign: "?", tone: "plain" },
};

function DebriefView(props: {
  scenario: ScenarioView;
  history: Turn[];
  walkedAway: boolean;
  debrief: Debrief | null;
  error: string | null;
  isReplay: boolean;
  onAgain: () => void;
  onHome: () => void;
}) {
  const { scenario, history, debrief } = props;
  const seen = history.filter((t) => t.from === "scammer").length;
  const unseen = scenario.stages.slice(seen);

  // Pair each recruiter message with the student's reply to it.
  const rows: { n: number; them: string; me?: string }[] = [];
  history.forEach((t) => {
    if (t.from === "scammer") rows.push({ n: rows.length + 1, them: t.text });
    else if (rows.length) rows[rows.length - 1].me = t.text;
  });

  return (
    <div className={s.debrief}>
      <header className={s.debriefHead}>
        <div className={s.scoreBlock}>
          {debrief ? (
            <>
              <span className={s.scoreCircle} aria-label={`Score ${debrief.score.score} out of 100`}>
                {debrief.score.score}
              </span>
              <span className={s.scoreLabel}>{debrief.score.label}</span>
            </>
          ) : props.error ? (
            <span className={s.scoreLabel}>{props.error}</span>
          ) : (
            <span className={s.marking}>Marking your chat…</span>
          )}
        </div>
        <div className={s.summary}>
          <h1 className={s.debriefTitle}>{scenario.title}</h1>
          {debrief && (
            <>
              <p>
                {props.walkedAway
                  ? `You walked away after message ${seen} of ${scenario.stages.length}.`
                  : "You stayed in the chat to the end. In real life, every extra message is another chance for them."}{" "}
                You pushed back on {debrief.score.flagsQuestioned} of the {seen} red flags you saw.
              </p>
              <ul className={s.breakdown}>
                {debrief.score.breakdown.map((b, i) => (
                  <li key={i}>
                    <span>{b.reason}</span>
                    <span className={b.points < 0 ? s.minus : undefined}>
                      {b.points > 0 ? `${b.points}` : `${b.points}`}
                    </span>
                  </li>
                ))}
              </ul>
              {!debrief.marked && (
                <p className={s.small}>
                  The AI marker was busy, so your replies aren&rsquo;t graded this time. The red flags below are still
                  accurate.
                </p>
              )}
            </>
          )}
        </div>
      </header>

      <ol className={s.script}>
        {rows.map((row) => {
          const stage = scenario.stages[row.n - 1];
          const flag = debrief?.judge.flags.find((f) => f.turn === row.n);
          const verdict = debrief?.judge.replies.find((r) => r.turn === row.n);
          const mark = verdict ? VERDICT_MARK[verdict.verdict] : null;
          const isExit = props.walkedAway && row.n === seen;
          return (
            <li key={row.n} className={s.scriptRow}>
              <div className={s.scriptChat}>
                <div className={s.them}>
                  <Marked text={row.them} quote={flag?.quote ?? ""} />
                </div>
                {row.me && (
                  <div className={s.meRow}>
                    {mark && (
                      <span className={`${s.verdict} ${s[mark.tone]}`} aria-hidden="true">
                        {mark.sign}
                      </span>
                    )}
                    <div className={s.me}>{row.me}</div>
                  </div>
                )}
                {isExit && <p className={s.exitLine}>You walked away here</p>}
              </div>
              <aside className={s.note}>
                <p className={s.noteFlag}>{stage.redFlag}</p>
                <p className={s.noteWhy}>{stage.why}</p>
                {verdict?.note && <p className={s.noteReply}>Your reply: {verdict.note}</p>}
              </aside>
            </li>
          );
        })}
      </ol>

      {unseen.length > 0 && (
        <section className={s.unseen}>
          <h2 className={s.h2}>What would have come next</h2>
          <ul>
            {unseen.map((st) => (
              <li key={st.id}>
                <strong>{st.redFlag}.</strong> {st.why}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={s.legit}>
        <h2 className={s.h2}>What a real employer does instead</h2>
        <ul>
          {scenario.stages.map((st) => (
            <li key={st.id}>{st.legit}</li>
          ))}
        </ul>
      </section>

      <div className={s.actions}>
        <button className={s.primary} onClick={props.onAgain}>
          {props.isReplay ? "Try it yourself" : "Practise again"}
        </button>
        <button className={s.secondary} onClick={props.onHome}>
          Pick another scam
        </button>
      </div>

      <footer className={s.footer}>
        <p>
          Real message? Check it at{" "}
          <a href="https://semakmule.rmp.gov.my/" target="_blank" rel="noreferrer">
            Semak Mule
          </a>
          . Already paid? Call NSRC on <a href="tel:997">997</a> now. The first hours matter most.
        </p>
      </footer>
    </div>
  );
}
