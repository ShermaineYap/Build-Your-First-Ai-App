import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Kalam } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-sans", subsets: ["latin"] });
const pen = Kalam({ variable: "--font-pen", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "ScamSparring: practise walking away from job scams",
  description:
    "A safe practice chat for Malaysian students. An AI plays a part-time job scammer; you practise spotting the red flags and walking away.",
};

export const viewport: Viewport = { themeColor: "#EEF2F6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${pen.variable}`}>
      <body>{children}</body>
    </html>
  );
}
