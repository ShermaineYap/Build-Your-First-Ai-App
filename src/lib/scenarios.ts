// Scam scripts are built only from patterns described in public police and news
// warnings (PDRM CCID, Bernama, The Star, NST). Every company, person and bank is fictional.

export type Language = "english" | "campur" | "bm";

export interface Stage {
  id: "hook" | "trust" | "small_payout" | "top_up" | "pressure";
  goal: string; // instruction to the scammer model
  redFlag: string; // what the debrief calls this red flag
  why: string; // why it matters, shown in the debrief
  legit: string; // what a real employer would do instead
}

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  contactName: string;
  company: string;
  persona: string;
  accountHolder: string; // fixed fictional name, so the model never invents one
  stages: Stage[];
  sampleReplies: string[]; // used to record demo replays
}

export const BANK = "Bank Seri Murni";

export const SCENARIOS: Scenario[] = [
  {
    id: "like_share",
    title: "The like-and-share task job",
    blurb: "Earn RM50–RM300 a day liking posts from your phone.",
    contactName: "Amy",
    company: "BrightReach Media",
    persona: "Recruiter 'Amy' from a fictional digital marketing agency called BrightReach Media Sdn Bhd",
    accountHolder: "Lee Mei Fong",
    stages: [
      {
        id: "hook",
        goal: "Cold-message the student offering easy part-time work from their phone: like and share social media posts, RM50-RM300 per day, no experience needed.",
        redFlag: "A job you never applied for, paying far too much for almost no work",
        why: "Real employers don't cold-message strangers with RM300-a-day offers for liking posts.",
        legit: "A real job comes from a listing you applied to, with a company you can look up.",
      },
      {
        id: "trust",
        goal: "Explain the 'task' system, give a first easy task (like 3 posts), and invite them into a Telegram task group run by a 'mentor'. Write [Telegram group link] instead of a link.",
        redFlag: "Moving you into a private Telegram group with a 'mentor'",
        why: "Groups full of 'members' posting earnings screenshots are staged to make the scheme look normal.",
        legit: "Real employers onboard you through official email and company systems, not an anonymous group chat.",
      },
      {
        id: "small_payout",
        goal: "Congratulate them warmly and say RM15 commission has been credited to them for the first task. Build trust and excitement.",
        redFlag: "A small payout to win your trust",
        why: "Scammers pay a little first so you believe the bigger promise. Police warn this is how the 'like and share' scam hooks people.",
        legit: "Being paid RM15 proves nothing. What matters is whether you're ever asked to pay them.",
      },
      {
        id: "top_up",
        goal: `Introduce a 'merchant task' or 'VIP level' that needs them to top up RM100 first to unlock RM180 back. Ask them to transfer to ${BANK} account 8888-XXXX-XXXX under the name of the account holder.`,
        redFlag: "Paying money to earn money",
        why: "This is the scam itself. Once you top up, there's always another 'level' to unlock, and the money doesn't come back.",
        legit: "A real job never asks you to pay to get paid. Walk away here at the latest.",
      },
      {
        id: "pressure",
        goal: "Apply urgency: the task slot expires in 15 minutes, other members have already paid, and if they quit now their earlier commission is forfeited.",
        redFlag: "Time pressure and the threat of losing what you 'earned'",
        why: "A countdown stops you from thinking or asking anyone. The 'forfeit' threat plays on loss aversion.",
        legit: "Anything legitimate can wait until you've checked with someone you trust.",
      },
    ],
    sampleReplies: [
      "hi, how u get my number? what kind of job is this",
      "ok can, so just like the posts only? need to join telegram ah?",
      "wah really got RM15? ok nice",
      "hmm why need to pay first? this one is job or investment?",
      "I think I want to stop here, can just withdraw the RM15?",
    ],
  },
  {
    id: "fee_recruiter",
    title: "The recruiter who wants a fee",
    blurb: "You're shortlisted for a RM3,800 work-from-home admin job.",
    contactName: "Mr. Daniel",
    company: "Kenanga Swift Logistics",
    persona: "HR executive 'Mr. Daniel' from a fictional logistics company called Kenanga Swift Logistics",
    accountHolder: "Ahmad Faizal bin Rosli",
    stages: [
      {
        id: "hook",
        goal: "Say you saw their resume on a job portal (don't name the portal) and they are shortlisted for a work-from-home admin assistant role, RM3,800/month, no interview needed.",
        redFlag: "Shortlisted for a job you never applied for, with no interview",
        why: "No interview and an above-market salary for entry-level admin work is how fake offers start.",
        legit: "Real recruiters name the role you applied for and schedule an interview.",
      },
      {
        id: "trust",
        goal: "Send a professional-sounding offer summary and ask for their full name and IC number 'for the contract'.",
        redFlag: "Asking for your IC number before any interview",
        why: "Your IC can be used to open mule bank accounts or loans in your name.",
        legit: "IC details are collected after a verified offer, through HR systems, never over chat.",
      },
      {
        id: "small_payout",
        goal: "Say HR has approved them, onboarding starts Monday, and promise a RM200 welcome allowance.",
        redFlag: "Approval and perks before any checks",
        why: "Fast approval makes you feel chosen and lowers your guard for the next request.",
        legit: "Real onboarding comes with a signed letter on company letterhead that you can verify.",
      },
      {
        id: "top_up",
        goal: `Ask for a RM250 'registration and laptop deposit fee', refundable with first salary, paid to a personal ${BANK} account 8888-XXXX-XXXX under the account holder's name (not the company).`,
        redFlag: "An upfront fee paid into a personal account",
        why: "Police say legitimate job applications never charge fees. A personal account name is a second red flag.",
        legit: "Employers provide equipment. They don't charge you a deposit to start work.",
      },
      {
        id: "pressure",
        goal: "Say other candidates are waiting and the offer goes to someone else by 6pm today unless they pay.",
        redFlag: "A same-day deadline to pay",
        why: "The deadline is there to stop you from checking the company or asking your family.",
        legit: "A real offer gives you time to accept in writing.",
      },
    ],
    sampleReplies: [
      "oh really? which company is this? I don't remember applying",
      "can I know more about the company first before I give my IC?",
      "ok thanks. so when I start ah?",
      "why the account name is personal one ah, not company account?",
      "sorry I need to check with my parents first",
    ],
  },
  {
    id: "money_mule",
    title: "The 'payment processing agent'",
    blurb: "5% commission, and all you need is your bank account.",
    contactName: "Jason",
    company: "NovaPay Ventures",
    persona: "Manager 'Jason' from a fictional online trading company called NovaPay Ventures",
    accountHolder: "NovaPay Supplier",
    stages: [
      {
        id: "hook",
        goal: "Offer a flexible part-time 'payment processing agent' job for students, 5% commission per transaction, only need a bank account and phone.",
        redFlag: "A job whose only requirement is your bank account",
        why: "If the job is your account, the job is money laundering. This is how mule accounts are recruited.",
        legit: "Real payment companies use their own licensed accounts, not students' personal ones.",
      },
      {
        id: "trust",
        goal: "Explain that customers will transfer money into their account and they forward it to the company's 'supplier' account, keeping commission. Say many students do it.",
        redFlag: "Receiving and forwarding strangers' money",
        why: "That money is usually stolen from other scam victims. Your account gets flagged and frozen.",
        legit: "No legitimate business needs to route customer payments through your personal account.",
      },
      {
        id: "small_payout",
        goal: "Say a first test transfer of RM500 has come in and they can keep RM25 after forwarding RM475 to the supplier account.",
        redFlag: "Commission for moving money",
        why: "Once you forward it, you've taken part. Account holders can be investigated even if they 'didn't know'.",
        legit: "Being paid to move money you don't own is the definition of a money mule.",
      },
      {
        id: "top_up",
        goal: "Ask them to let the company 'manage' their account for faster processing by sharing their online banking login and TAC codes.",
        redFlag: "Asking for your banking login or TAC",
        why: "With your login and TAC, they control your account. No real company ever needs these.",
        legit: "Never share a TAC or password with anyone, including people who say they're from a bank.",
      },
      {
        id: "pressure",
        goal: "Say a big batch is coming now, they must respond within 10 minutes or lose commission, and reassure them it is 100% legal.",
        redFlag: "Urgency plus '100% legal' reassurance",
        why: "Nobody needs to tell you a real job is legal. The rush is there to stop you checking Semak Mule.",
        legit: "Check any account or number at semakmule.rmp.gov.my before you act.",
      },
    ],
    sampleReplies: [
      "what is payment processing agent? is this legit company?",
      "so the money is from customers? why cannot they pay the company directly?",
      "hmm ok I see the money. so I just transfer the rest?",
      "eh no la, I don't want to share my TAC",
      "I think this is mule account thing, I'm not continuing",
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const LANGUAGES: { id: Language; label: string; instruction: string }[] = [
  { id: "english", label: "English", instruction: "Write in simple Malaysian English." },
  {
    id: "campur",
    label: "Campur",
    instruction:
      "Write the way Malaysian scam recruiters actually text: casual Malaysian English mixed with Bahasa Melayu words and particles (lah, ah, ya, boleh, sikit, terus, untung, dah), short lines, a few emojis. Don't overdo the slang.",
  },
  {
    id: "bm",
    label: "BM",
    instruction: "Write in casual, everyday Bahasa Melayu as used in WhatsApp or Telegram messages in Malaysia.",
  },
];
