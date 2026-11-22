## The problem, and who it's for

Malaysian police recorded about **8,900 part-time job scam cases and RM222 million in losses in 2025**, up about 144% on 2024 ([The Star, 10 Jan 2026](https://www.thestar.com.my/news/nation/2026/01/10/cops-no-fees-for-job-applications)). Students are a named victim group: 864 of 10,304 job-scam victims from January 2025 to mid-March 2026 ([FMT/Bernama](https://www.freemalaysiatoday.com/category/nation/2026/04/07/bukit-aman-warns-of-like-and-share-approach-in-online-job-scams)). And once the money is gone, it rarely comes back: under 3% of the losses reported to the National Scam Response Centre from January to August 2026 were returned ([The Vibes, 17 Nov 2026](https://www.thevibes.com/articles/news/129651/less-than-3-of-rm250m-scam-losses-recovered-and-returned-to-victims)).

Scam *checkers* already exist (Whoscall's AI Content Checker, PDRM's Semak Mule, and an AI checking app promised in Budget 2027). But a checker only helps if you think to check, and job scams are designed so you don't: they start friendly, pay you a small real commission, and only ask for money once you trust them.

**ScamSparring is for Malaysian university students and fresh graduates looking for part-time work.** It's a sparring partner: practise walking away before a real scam finds you.

## What it does

1. Pick one of three scams built from public police warnings: the **like-and-share task job**, the **recruiter who charges a fee**, or the **"payment processing agent"** (money-mule recruitment).
2. Pick the language: **English, BM, or Campur**, the mixed Malaysian English and BM that real scam texts use.
3. Chat with the AI recruiter. Reply however you like. Press **Walk away** whenever you've had enough.
4. Your chat comes back **marked in red pen**, like an exam script: the exact phrase that carried each red flag is underlined, every reply gets a tick or a cross, the margin explains why it matters and what a real employer does instead, and you get a score.

There are also **three recorded chats** to watch with no AI quota used, and a **pilot study page** (`/study`) with a before-and-after "scam or legit?" quiz.

## Creativity and originality

- **Practice, not detection.** It's built on inoculation research: Google's ShieldUp! game improved scam identification in a 3,000-person trial in India ([arXiv 2503.12341](https://arxiv.org/abs/2503.12341)). ScamSparring applies that idea to Malaysian job scams, as a chat in the languages people actually receive them in.
- **The red-pen debrief.** The marking looks like a teacher's red pen on an exercise book, which every Malaysian student recognises, with the scam phrase circled where it happened rather than a generic list of tips.
- **Code-controlled stages.** The AI improvises the wording, but the scam always follows the same teachable arc: hook, trust, small payout, top-up, pressure.

## Implementation and functionality

**AI used:** `openai/gpt-oss-120b` on **Groq** (free tier) writes the scammer and marks the chat. If it's busy, the app falls back to `openai/gpt-oss-20b` on Groq, then `gemini-flash-lite-latest` via the **Gemini API**. Built with **Next.js 16 + TypeScript**, deployed on **Vercel**.

How the AI part works:

- **A stage machine in code** picks which of 5 stages comes next. The model gets that stage's goal and the red flag to plant, plus a "not yet" list of later stages, so it can't jump ahead (for example asking for money in the first message).
- **A separate marking call** reads the finished chat and returns JSON: the exact phrase carrying each red flag, and a label for each reply (refused, questioned, complied, neutral).
- **Verification, not trust:** a highlight is shown only if the quoted phrase really exists in the message (tolerating curly quotes and odd dashes). Malformed output is dropped, not shown.
- **Deterministic scoring:** the model only labels; the points come from fixed rules (walk away early = more points; agreeing to pay or share banking details costs most), so the same chat always gets the same score.
- **Safety guards:** real IC, phone and account numbers, emails and passwords are blocked before sending, in the browser and again on the server. Model output is filtered for real banks, brands, famous names, links and phone numbers (regenerated once, then cleaned). Every company, person and "Bank Seri Murni" is fictional.
- **Built for free-tier limits:** Groq allows 8,000 tokens per minute per model, and one chat uses about 5,500. Load spreads across models, short rate-limit waits are retried once, there are per-device daily caps, and recorded replays use no quota.
- **Tested:** 35 unit tests; Playwright browser tests on the live site (live chat, IC block, walk-away, marking, study page).

## Usefulness and real-world impact

What I measured with the live API (scripts are in the repo):

| Test | Result |
|---|---|
| Feasibility test (20–21 Nov): messages that refused the role or broke character | **0 / 45** |
| Feasibility test: messages on the stage set by the code, with its red flag present (AI-judged) | **45 / 45** |
| Early messages mentioning a bank, after a prompt fix (22 Nov) | **0 / 18** |
| Recruiter messages that got an exact red-flag highlight (22 Nov) | **39 / 40** |
| Simultaneous chats that completed and were marked (22 Nov) | **3 / 3** |
| Median reply time | **about 1 second** |

**In progress:** agreement between the AI marker and my own labels on 40 replies, and a before-and-after pilot with coursemates. I'll update this section with the results.

The app ends every debrief with the real next steps: check a number or account at **Semak Mule**, and if you've already paid, call **NSRC on 997** straight away.

## Limitations (honestly)

- It's a practice tool, not a checker, and it hasn't been tested in a trial; the coursemate study is a small pilot.
- The AI marker can be generous on borderline replies. In testing, the smaller fallback model marked clear "going along" replies as sceptical questions, so marking now waits for the larger model when it can.
- Language control is loose: BM and Campur messages often mix in English, as real ones do.
- Free tiers have daily caps. During heavy testing the larger model hit Groq's daily token limit; the app then falls back to the smaller model, and the recorded replays always work.

## Challenges I ran into

- Getting a model to play a scammer *convincingly but safely*: no real banks, no real people's names (it kept using a famous singer's name as the account holder), no links, no asking for money too early.
- Free-tier limits: two people chatting at once used to hit Groq's per-minute token cap.
- Making AI marking trustworthy: checking every quote against the original text, and keeping the score out of the model's hands.

## What I learned

- Measure before claiming: several "it works" moments turned out wrong once I read the transcripts.
- Put the rules in code and let the model do only the language.
- Small settings matter: lowering reasoning effort saved tokens but made the marker too lenient, so marking keeps a higher setting.

## My contribution and AI tools used

I chose the problem and audience, made the product and design decisions, judged whether the BM and Campur messages read like real scam texts, and am hand-labelling the evaluation set and running the coursemate pilot. I built this with substantial help from **Claude (Anthropic)**, which researched the problem, wrote most of the code, prompts, tests and evaluation scripts under my direction, and produced the demo video (the narration is an AI voice, Piper TTS). All scam scripts are based on public police warnings; fonts are Instrument Sans and Kalam (SIL Open Font License).

## What's next

- Finish the human-label agreement check and the coursemate pilot, and publish the numbers.
- More scenarios (love scams, fake e-commerce sellers, overseas job traps) and a teacher mode for university anti-scam talks.

**Try it:** https://scam-sparring.vercel.app · **Code:** https://github.com/ShermaineYap/Build-Your-First-Ai-App
