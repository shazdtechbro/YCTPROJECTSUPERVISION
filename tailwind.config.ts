import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1240px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#EEF7F0", 100: "#D9EEDF", 200: "#B4DCBF", 300: "#7FC294",
          500: "#1F8A4C", 600: "#0E7A3A", 700: "#006600", 800: "#0B4D24",
          900: "#08361A", 950: "#05230F",
        },
        sun: { 100: "#FFF4CC", 200: "#FFE899", 300: "#FFDB5C", 400: "#FDC800", 500: "#E6B400" },
        cream: { DEFAULT: "#FBF8F0", 2: "#F4EFE3" },
        ink: { DEFAULT: "#111611", 2: "#4A5149", 3: "#6B7269" },
        line: "#E7E2D5",
        behind: "#A86400",
        stalled: "#C8352A",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        status: {
          "on-track": "hsl(var(--status-on-track))",
          behind: "hsl(var(--status-behind))",
          stalled: "hsl(var(--status-stalled))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl2: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,22,17,.04), 0 8px 24px -12px rgba(17,22,17,.12)",
        float: "0 24px 60px -20px rgba(8,54,26,.35)",
        // legacy names now resolve to soft shadows
        brutal: "0 1px 2px rgba(17,22,17,.04), 0 8px 24px -12px rgba(17,22,17,.12)",
        "brutal-sm": "0 1px 2px rgba(17,22,17,.05)",
        "brutal-lg": "0 24px 60px -20px rgba(8,54,26,.35)",
        none: "none",
      },
      fontSize: { "2xs": ["0.75rem", { lineHeight: "1rem" }] },
      transitionTimingFunction: { out: "cubic-bezier(.22,1,.36,1)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        pulseDot: { "0%": { boxShadow: "0 0 0 0 rgba(253,200,0,.6)" }, "100%": { boxShadow: "0 0 0 10px rgba(253,200,0,0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in .45s cubic-bezier(.22,1,.36,1)",
        floaty: "floaty 6s ease-in-out infinite",
        "pulse-dot": "pulseDot 1.8s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
