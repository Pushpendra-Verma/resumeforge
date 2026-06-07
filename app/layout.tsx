import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// The locked template's typeface. Loaded with next/font so it is bundled,
// stable offline, and identical on screen and in the exported PDF.
// The original resume embeds only Poppins Light (300), Medium (500) and
// SemiBold (600), so we load exactly those three weights to clone it.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeForge — Edit content, lock the design",
  description:
    "Upload any resume (PDF/DOCX), edit every part freely, and export into one fixed premium template.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
