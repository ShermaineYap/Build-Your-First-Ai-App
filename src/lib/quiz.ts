// Before/after "scam or legit?" quiz for the pilot study.
// Two matched sets (5 scams, 3 legit each) covering the same red flags, so pre and post can be compared.
// Which set comes first is randomised per person to cancel out any difference in difficulty.

export interface QuizItem {
  id: string;
  from: string;
  text: string;
  scam: boolean;
  why: string;
}

export const SET_A: QuizItem[] = [
  {
    id: "a1",
    from: "Nadia, Brightwave Media",
    text: "Hi! Part-time job from your phone, just like & share posts. RM80–RM250 per day, no experience needed 😊 Interested? Reply YES",
    scam: true,
    why: "Unsolicited, high pay for trivial work: the like-and-share hook.",
  },
  {
    id: "a2",
    from: "Lumina Analytics HR",
    text: "Hi Aina, thanks for applying to the Data Analyst Intern role through our careers page. Are you free for a 20-minute video interview on Thursday 3pm or Friday 10am?",
    scam: false,
    why: "Refers to a role you applied for, and books a real interview. Nothing to pay or hand over.",
  },
  {
    id: "a3",
    from: "Verity Logistics HR",
    text: "Congratulations! You're shortlisted for WFH Admin, RM4,000/month, no interview needed. Please send your full name and IC number so we can prepare your contract.",
    scam: true,
    why: "No interview, above-market pay, and your IC requested over chat.",
  },
  {
    id: "a4",
    from: "Jason, Orbix Payments",
    text: "Student part-time: payment agent, 5% commission per transaction. You only need your own bank account to receive and forward client payments.",
    scam: true,
    why: "A job whose only requirement is your bank account is money-mule recruitment.",
  },
  {
    id: "a5",
    from: "Lumina Analytics HR",
    text: "Your offer letter is attached as a PDF. Please review, sign and return it by 30 Nov. Contact Ms Tan in HR through the email on our website if you have questions.",
    scam: false,
    why: "A written offer to review in your own time, with a contact you can verify independently.",
  },
  {
    id: "a6",
    from: "Brightwave Task Mentor",
    text: "Great job on today's tasks! 🎉 VIP level unlocked. Top up RM150 first and the system returns RM260 within 10 minutes.",
    scam: true,
    why: "Paying money to earn money. This is the point where task scams take your cash.",
  },
  {
    id: "a7",
    from: "Campus Café Supervisor",
    text: "Reminder: your shift starts 9am Saturday. Remember to bring your student card for the timesheet.",
    scam: false,
    why: "An ordinary work message with no request for money or details.",
  },
  {
    id: "a8",
    from: "Orbix Onboarding Team",
    text: "Before you start Monday we need a RM300 laptop deposit, refundable with your first salary. Please transfer to our supervisor's personal account today.",
    scam: true,
    why: "An upfront fee to a personal account, with a same-day deadline.",
  },
];

export const SET_B: QuizItem[] = [
  {
    id: "b1",
    from: "Mei, Lumora Digital",
    text: "Hello! We need online promoters 📱 Just follow and share our posts, earn RM60–RM300 a day from home. No experience needed, start today!",
    scam: true,
    why: "Unsolicited, high pay for trivial work: the like-and-share hook.",
  },
  {
    id: "b2",
    from: "Kestrel Engineering Talent Team",
    text: "Hi Jun Wei, thank you for your application for the IT Support Intern position. We'd like to invite you to an online interview. Please pick a slot using the scheduling link in the email we sent from our company address.",
    scam: false,
    why: "Matches an application you made and moves to a normal interview.",
  },
  {
    id: "b3",
    from: "Cresta Data Recruitment",
    text: "We found your resume online and you've been selected for Data Entry WFH, RM3,900 a month. No interview. Send a photo of your IC (front and back) to confirm.",
    scam: true,
    why: "Selected without applying or interviewing, and asked for your IC photos.",
  },
  {
    id: "b4",
    from: "Daniel, NovaLink Pay",
    text: "Easy money for students: lend us your bank account for client transfers, keep RM50 for every RM1,000 you pass on. 100% legal.",
    scam: true,
    why: "Being paid to move money through your account makes you a money mule.",
  },
  {
    id: "b5",
    from: "Kestrel Engineering Talent Team",
    text: "Please find your internship contract attached. Take your time to read it, and let us know by Friday if you'd like to accept. Your start date would be 5 January.",
    scam: false,
    why: "Gives you time and a written contract, and asks for nothing up front.",
  },
  {
    id: "b6",
    from: "Lumora Task Group Admin",
    text: "Members who completed level 2 got RM200 commission today! To join level 3 you need to deposit RM120 first. Slots close in 15 minutes ⏰",
    scam: true,
    why: "A deposit to unlock earnings, plus a countdown to rush you.",
  },
  {
    id: "b7",
    from: "Library Assistant Coordinator",
    text: "Hi, your timesheet for November has been approved. Payment will go to the bank account you registered with the university finance office.",
    scam: false,
    why: "Pays you through an official channel you already set up, and asks for nothing.",
  },
  {
    id: "b8",
    from: "NovaLink Account Manager",
    text: "To speed up your commission, please share your online banking username and the TAC code you just received. Our system will handle the transfers for you.",
    scam: true,
    why: "Nobody legitimate ever needs your banking login or TAC.",
  },
];

export function scoreQuiz(items: QuizItem[], answers: Record<string, boolean>): number {
  return items.reduce((n, item) => n + (answers[item.id] === item.scam ? 1 : 0), 0);
}

/** Short anonymous code a participant sends back, e.g. SS-AB-5-7-KQX (order, before, after, random tag). */
export function resultCode(order: "AB" | "BA", before: number, after: number, rand: () => number = Math.random): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const tag = Array.from({ length: 3 }, () => letters[Math.floor(rand() * letters.length)]).join("");
  return `SS-${order}-${before}-${after}-${tag}`;
}

export function parseResultCode(code: string): { order: "AB" | "BA"; before: number; after: number } | null {
  const m = code.trim().toUpperCase().match(/^SS-(AB|BA)-([0-8])-([0-8])-[A-Z]{3}$/);
  return m ? { order: m[1] as "AB" | "BA", before: Number(m[2]), after: Number(m[3]) } : null;
}
