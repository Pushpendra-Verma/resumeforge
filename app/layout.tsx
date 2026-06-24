import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";

// UI typeface for the app chrome (landing, dashboard, editor).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// The IIM template's typeface. Loaded with next/font so it is bundled, stable
// offline, and identical on screen and in the exported PDF. Templates that need
// other faces load their own here.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoodResume — Build resumes that open doors",
  description:
    "Create professional, ATS-friendly resumes in minutes with modern templates. Sign in with Google — your resumes stay private, on your device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
