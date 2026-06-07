"use client";

import dynamic from "next/dynamic";
import { Splash } from "@/components/brand";

// Client-only: the editor generates IDs and reads localStorage on load.
const EditorScreen = dynamic(() => import("@/components/EditorScreen"), {
  ssr: false,
  loading: () => <Splash label="Loading editor…" />,
});

export default function EditorPage() {
  return <EditorScreen />;
}
