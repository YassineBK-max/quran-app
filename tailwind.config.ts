import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        "bookmark-red": "#EF4444",
        "bookmark-blue": "#3B82F6",
        "bookmark-green": "#22C55E",
        "bookmark-yellow": "#EAB308",
        "bookmark-purple": "#A855F7",
      },
      fontFamily: {
        arabic: ['"Amiri"', "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
