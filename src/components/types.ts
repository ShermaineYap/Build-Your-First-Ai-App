import type { Language } from "@/lib/scenarios";
import type { Turn } from "@/lib/prompts";
import type { JudgeOutput, ScoreResult } from "@/lib/score";

export interface ScenarioView {
  id: string;
  title: string;
  blurb: string;
  contactName: string;
  company: string;
  stages: { id: string; redFlag: string; why: string; legit: string }[];
}

export interface LanguageView {
  id: Language;
  label: string;
}

export interface Debrief {
  judge: JudgeOutput;
  score: ScoreResult;
  marked: boolean;
}

export interface Replay {
  id: string;
  scenarioId: string;
  language: Language;
  label: string;
  history: Turn[];
  walkedAway: boolean;
  debrief: Debrief;
  recordedAt: string;
  model: string;
}

export type { Turn, Language };
