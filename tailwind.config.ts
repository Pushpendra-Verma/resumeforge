import type { Config } from "tailwindcss";

/**
 * Tailwind is used for the *application UI* (editor, toolbar, panels).
 * The locked resume template defines its own design tokens here so that
 * the renderer's appearance can never be altered by edited content.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Application chrome
        app: {
          bg: "#f3f4f6",
          panel: "#ffffff",
          border: "#e5e7eb",
          accent: "#2563eb",
        },
        // Locked resume template palette (do not change at runtime)
        resume: {
          ink: "#1a1a1a",
          sub: "#444444",
          bar: "#e4e4e4",
          line: "#bdbdbd",
          link: "#0a66c2",
        },
      },
      fontFamily: {
        resume: ['"Lato"', '"Helvetica Neue"', "Arial", "system-ui", "sans-serif"],
        ui: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
