// Two guards: stop students typing real personal data, and stop the model
// producing anything that points at a real bank, brand, person or link.

export type PiiKind = "ic" | "phone" | "account" | "email" | "card" | "secret";

const PII_RULES: { kind: PiiKind; re: RegExp }[] = [
  { kind: "ic", re: /\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/ },
  { kind: "card", re: /\b(?:\d[ -]?){15,16}\b/ },
  { kind: "phone", re: /(?:\+?60[-\s]?|\b0)1\d[-\s]?\d{3,4}[-\s]?\d{4}\b/ },
  { kind: "account", re: /\b\d{10,14}\b/ },
  { kind: "email", re: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/ },
  { kind: "secret", re: /\b(password|passwd|kata laluan|pin)\s*[:=]?\s*\S{4,}/i },
];

const PII_MESSAGES: Record<PiiKind, string> = {
  ic: "That looks like an IC number.",
  card: "That looks like a card number.",
  phone: "That looks like a real phone number.",
  account: "That looks like a bank account number.",
  email: "That looks like a real email address.",
  secret: "That looks like a password or PIN.",
};

/** Returns a warning if the text seems to contain real personal data, else null. */
export function detectPii(text: string): { kind: PiiKind; message: string } | null {
  for (const { kind, re } of PII_RULES) {
    if (re.test(text)) {
      return {
        kind,
        message: `${PII_MESSAGES[kind]} Don't type real details, even in practice. If you want to play along, type something obviously fake like "XXXX".`,
      };
    }
  }
  return null;
}

const REAL_BANKS =
  /\b(Maybank|CIMB|Public Bank|RHB|Hong Leong|AmBank|Bank Islam|Bank Rakyat|BSN|Affin|Alliance Bank|OCBC|UOB|HSBC|Standard Chartered|Touch ?'?n ?Go|TNG|GrabPay|Boost|ShopeePay|BigPay)\b/gi;
const REAL_BRANDS = /\b(Shopee|Lazada|JobStreet|Indeed|LinkedIn|Hiredly|Maukerja|Petronas|TikTok Shop)\b/gi;
// Well-known Malaysians the model tends to reach for as "default" names.
const REAL_PEOPLE = /\b(Siti Nurhaliza|Lee Chong Wei|Michelle Yeoh|Anwar Ibrahim|Mahathir|Nicol David|Yuna Zarai)\b/gi;
const LINKS = /(https?:\/\/\S+|www\.\S+|\bt\.me\/\S+|\bwa\.me\/\S+|\bbit\.ly\/\S+)/gi;
const HANDLES = /(^|\s)@[A-Za-z0-9_]{3,}/g;
const PHONES = /(?:\+?60[-\s]?|\b0)1\d[-\s]?\d{3,4}[-\s]?\d{4}\b/g;
const META = /(as an AI|I can(?:'|no)t (?:help|assist|role|write|create)|I'?m sorry, but|this is a (?:simulation|training)|\bsimulator\b|play money|\[Stage)/i;

export interface FilterResult {
  text: string;
  problems: string[]; // what was found before cleaning
}

/** Find problems in model output. Used to decide whether to regenerate. */
export function findOutputProblems(text: string): string[] {
  const problems: string[] = [];
  const hit = (re: RegExp) => {
    re.lastIndex = 0;
    return re.test(text);
  };
  if (!text.trim()) problems.push("empty");
  if (hit(REAL_BANKS)) problems.push("real_bank");
  if (hit(REAL_BRANDS)) problems.push("real_brand");
  if (hit(REAL_PEOPLE)) problems.push("real_person");
  if (hit(LINKS) || hit(HANDLES)) problems.push("link");
  if (hit(PHONES)) problems.push("phone");
  if (META.test(text)) problems.push("meta");
  return problems;
}

/** Last-resort cleanup when a regenerated message still has problems. */
export function sanitizeOutput(text: string, bank: string, accountHolder: string): FilterResult {
  const problems = findOutputProblems(text);
  const out = text
    .replace(REAL_BANKS, bank)
    .replace(REAL_BRANDS, "a job site")
    .replace(REAL_PEOPLE, accountHolder)
    .replace(LINKS, "[link]")
    .replace(HANDLES, "$1[contact]")
    .replace(PHONES, "[number]")
    .trim();
  return { text: out, problems };
}
