# ScamSparring

Practise walking away from a job scam before a real one finds you.

ScamSparring is a safe practice chat for Malaysian university students. An AI plays a part-time job scam recruiter, in English, Bahasa Melayu or the mixed "campur" style real scammers use. You reply however you like and press **Walk away** when you spot the scam. Then your chat comes back marked in red pen: the exact phrase where each red flag appeared, a tick or cross on each of your replies, and a score.

**Why:** Malaysian police recorded about 8,900 part-time job scam cases and RM222 million in losses in 2025, up about 144% on 2024 ([The Star, Jan 2026](https://www.thestar.com.my/news/nation/2026/01/10/cops-no-fees-for-job-applications)). Students are a named victim group ([FMT/Bernama, Apr 2026](https://www.freemalaysiatoday.com/category/nation/2026/04/07/bukit-aman-warns-of-like-and-share-approach-in-online-job-scams)). Scam *checkers* already exist, but they only help if you think to check. Practice builds the instinct earlier. Inoculation research supports this: in a 3,000-person trial, Google's ShieldUp! game improved people's ability to identify scams versus control groups ([arXiv 2503.12341](https://arxiv.org/abs/2503.12341)). ScamSparring has **not** been tested in a trial; see Limitations.

## Try it

- **Live demo:** https://scam-sparring.vercel.app
- **No quota needed:** on the home page, pick one of the three **recorded chats** to watch a real AI session and its marking.

## Features

- Three scam scripts built from public police warnings: the like-and-share task job, the recruiter who charges a fee, and money-mule recruitment.
- Three languages: English, Campur (Malaysian English mixed with BM), BM.
- **Stage machine in code:** our code decides each scam stage (hook, trust, small payout, top-up, pressure); the model only writes the message for that stage, so the chat is realistic but follows a fixed, teachable arc.
- **Red-pen debrief:** a second AI call marks the exact phrase carrying each red flag and labels each reply (refused, questioned, complied, neutral). Highlights are only shown if the quoted phrase really exists in the message.
- **Deterministic score:** points come from our code, not the model: earlier walk-away scores higher, and agreeing to pay or share banking details costs the most.
- **Safety guards:**
  - blocks real IC numbers, phone numbers, account numbers, emails and passwords before they're sent (client and server)
  - filters model output for real banks, brands, famous names, links and phone numbers (regenerate once, then clean up)
  - every company, person and "Bank Seri Murni" is fictional
- **Quota protection:** per-device and per-day limits, automatic fallback from Groq to Gemini, and recorded replays that use no AI.

## AI implementation

| Part | Model / API | Notes |
|---|---|---|
| Scammer messages | `openai/gpt-oss-120b` on Groq (free tier) | Fallback: `gemini-flash-lite-latest` via Gemini's OpenAI-compatible API |
| Debrief marking | Same providers, JSON mode, temperature 0 | Output validated and quotes checked against the original text |

Prompts are in `src/lib/prompts.ts`, scenarios in `src/lib/scenarios.ts`, scoring in `src/lib/score.ts`.

## Measured results (feasibility study, 20–21 Nov 2026)

9 practice sessions per model (45 recruiter messages), 3 scenarios × 3 languages, graded by a separate model call plus reading by eye:

| | gpt-oss-120b (Groq) | gemini-flash-lite |
|---|---|---|
| Refused or broke character | 0 / 45 | 0 / 45 |
| On the right stage, with the red flag present | 45 / 45 | 45 / 45 |
| Realism, 1–5 (AI judge) | 4.7 | 4.7 |
| Median reply time | 1.1 s | 1.0 s |

After a prompt fix, 0 of 12 opening messages asked for money too early. Judge accuracy against human labels and a small user study are still to come.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your free Groq and/or Gemini keys
npm run dev                  # http://localhost:3000
npm test                     # unit tests
```

Scripts in `scripts/` (Python, need the app running): `live-check.py` plays one chat through the API, `record-replays.py` regenerates the demo replays, `stage-check.py` checks that early messages don't ask for money, `e2e-live.py` and `shots.py` run Playwright browser tests.

## Limitations

- Not clinically or experimentally validated; any user-study numbers are a small pilot.
- The AI judge can be generous or harsh on borderline replies; the score's rules are fixed, but the labels come from a model.
- Language control is loose: BM and Campur messages often mix in English, as real ones do.
- Free-tier limits mean live chats are capped per device and per day; replays are always available.
- Rate limits are a courtesy (cookie plus in-memory counter), not security.

## Credits and disclosure

- Built by Shermaine Yap Shi Min for Build Your First AI App 2026 (Yasir Insights, Devpost).
- AI-assisted development: built with help from Claude (Anthropic) for research, code and testing. All design decisions, testing and judgement of the Manglish/BM output are the author's.
- Fonts: Instrument Sans and Kalam (Google Fonts, SIL Open Font License).
- Scam patterns: public warnings from PDRM's Commercial Crime Investigation Department, as reported by Bernama, The Star, NST and FMT.

If you receive a real message like these, check it at [Semak Mule](https://semakmule.rmp.gov.my/). If you've already sent money, call the National Scam Response Centre on **997** immediately.

## Licence

MIT
