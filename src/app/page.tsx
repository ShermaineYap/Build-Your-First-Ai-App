import App from "@/components/App";
import { SCENARIOS, LANGUAGES } from "@/lib/scenarios";
import replays from "@/data/replays.json";
import type { Replay } from "@/components/types";

export default function Page() {
  const scenarios = SCENARIOS.map((s) => ({
    id: s.id,
    title: s.title,
    blurb: s.blurb,
    contactName: s.contactName,
    company: s.company,
    stages: s.stages.map(({ id, redFlag, why, legit }) => ({ id, redFlag, why, legit })),
  }));
  const languages = LANGUAGES.map(({ id, label }) => ({ id, label }));
  return <App scenarios={scenarios} languages={languages} replays={replays as Replay[]} />;
}
