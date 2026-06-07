"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/brand";

// Client-only: the dashboard reads per-user documents from localStorage.
const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  ssr: false,
  loading: () => <Splash label="Loading your resumes…" />,
});

export default function DashboardPage() {
  return <Dashboard />;
}
