"use client";

import Link from "next/link";
import { useState } from "react";
import { SET_A, SET_B, resultCode, scoreQuiz, type QuizItem } from "@/lib/quiz";
import s from "./Study.module.css";

type Step = "intro" | "before" | "practice" | "after" | "done";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Quiz(props: {
  items: QuizItem[];
  answers: Record<string, boolean>;
  onAnswer: (id: string, scam: boolean) => void;
  onDone: () => void;
  doneLabel: string;
}) {
  const answered = props.items.filter((i) => props.answers[i.id] !== undefined).length;
  return (
    <>
      <ol className={s.items}>
        {props.items.map((item, n) => (
          <li key={item.id} className={s.item}>
            <fieldset className={s.itemSet}>
              <legend className={s.srOnly}>Message {n + 1}</legend>
              <p className={s.from}>{item.from}</p>
              <p className={s.bubble}>{item.text}</p>
              <div className={s.choice}>
                {[
                  { label: "Scam", value: true },
                  { label: "Legit", value: false },
                ].map((opt) => (
                  <label key={opt.label} data-selected={props.answers[item.id] === opt.value}>
                    <input
                      type="radio"
                      name={item.id}
                      checked={props.answers[item.id] === opt.value}
                      onChange={() => props.onAnswer(item.id, opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <div className={s.footerBar}>
        <span className={s.small}>
          {answered} of {props.items.length} answered
        </span>
        <button className={s.primary} disabled={answered < props.items.length} onClick={props.onDone}>
          {props.doneLabel}
        </button>
      </div>
    </>
  );
}

export default function Study() {
  const [step, setStep] = useState<Step>("intro");
  const [order, setOrder] = useState<"AB" | "BA">("AB");
  const [first, setFirst] = useState<QuizItem[]>([]);
  const [second, setSecond] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [practised, setPractised] = useState(false);
  const [code, setCode] = useState("");

  const start = () => {
    const o = Math.random() < 0.5 ? "AB" : "BA";
    setOrder(o);
    setFirst(shuffle(o === "AB" ? SET_A : SET_B));
    setSecond(shuffle(o === "AB" ? SET_B : SET_A));
    setStep("before");
    window.scrollTo({ top: 0 });
  };

  const answer = (id: string, scam: boolean) => setAnswers((a) => ({ ...a, [id]: scam }));

  const finish = () => {
    setCode(resultCode(order, scoreQuiz(first, answers), scoreQuiz(second, answers)));
    setStep("done");
    window.scrollTo({ top: 0 });
  };

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <p className={s.brand}>
          <Link href="/">ScamSparring</Link>
        </p>

        {step === "intro" && (
          <section>
            <h1 className={s.h1}>Help test ScamSparring</h1>
            <p>It takes about 10 minutes:</p>
            <ol className={s.steps}>
              <li>Say whether 8 short messages are a scam or legit.</li>
              <li>Do one practice chat against the AI scammer, in a new tab.</li>
              <li>Answer 8 different messages.</li>
              <li>Send the code you get at the end to the person who shared this link.</li>
            </ol>
            <p className={s.small}>
              It&rsquo;s anonymous. Your answers stay in your browser; only the short code (two scores and three
              random letters) is shared, and only if you send it. Answer on your own first instinct and don&rsquo;t
              look things up.
            </p>
            <button className={s.primary} onClick={start}>
              Start
            </button>
          </section>
        )}

        {step === "before" && (
          <section>
            <h1 className={s.h1}>Scam or legit?</h1>
            <p className={s.small}>Part 1 of 3. Every company and person here is made up.</p>
            <Quiz
              items={first}
              answers={answers}
              onAnswer={answer}
              doneLabel="Next: practice chat"
              onDone={() => {
                setStep("practice");
                window.scrollTo({ top: 0 });
              }}
            />
          </section>
        )}

        {step === "practice" && (
          <section>
            <h1 className={s.h1}>Now do one practice chat</h1>
            <p>
              Part 2 of 3. Open ScamSparring in a new tab, pick any scam, chat until you decide to walk away, and read
              your marked chat. Then come back to this tab.
            </p>
            <p>
              <a className={s.primaryLink} href="/" target="_blank" rel="noopener">
                Open a practice chat in a new tab
              </a>
            </p>
            <label className={s.confirm}>
              <input type="checkbox" checked={practised} onChange={(e) => setPractised(e.target.checked)} />
              I finished a practice chat and read the marking
            </label>
            <button
              className={s.primary}
              disabled={!practised}
              onClick={() => {
                setStep("after");
                window.scrollTo({ top: 0 });
              }}
            >
              Next: 8 more messages
            </button>
          </section>
        )}

        {step === "after" && (
          <section>
            <h1 className={s.h1}>Scam or legit?</h1>
            <p className={s.small}>Part 3 of 3. Different messages this time.</p>
            <Quiz items={second} answers={answers} onAnswer={answer} doneLabel="See my code" onDone={finish} />
          </section>
        )}

        {step === "done" && (
          <section>
            <h1 className={s.h1}>Thank you</h1>
            <p>Please send this code to the person who shared the link:</p>
            <p className={s.code} aria-label="Your result code">
              {code}
            </p>
            <button
              className={s.secondary}
              onClick={() => {
                try {
                  void navigator.clipboard.writeText(code);
                } catch {
                  /* copying is a convenience; the code is on screen */
                }
              }}
            >
              Copy code
            </button>
            <h2 className={s.h2}>The answers</h2>
            <ol className={s.answers}>
              {[...first, ...second].map((item) => {
                const right = answers[item.id] === item.scam;
                return (
                  <li key={item.id}>
                    <span className={right ? s.right : s.wrong}>{right ? "✓" : "✗"}</span>{" "}
                    <strong>{item.scam ? "Scam" : "Legit"}:</strong> {item.text}
                    <br />
                    <span className={s.small}>{item.why}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
