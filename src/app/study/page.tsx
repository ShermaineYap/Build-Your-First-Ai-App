import type { Metadata } from "next";
import Study from "@/components/Study";

export const metadata: Metadata = {
  title: "Help test ScamSparring",
  description: "A 10-minute anonymous study: spot scam messages, do one practice chat, and spot some more.",
};

export default function StudyPage() {
  return <Study />;
}
