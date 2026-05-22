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
      // ── FONTS ──────────────────────────────────────────────
      fontFamily: {
        display: ["SanguSuruhee", "Noto Sans Thaana", "sans-serif"],
        body: ["MVTypewriter", "Noto Sans Thaana", "sans-serif"],
      },

      // ── COLORS ─────────────────────────────────────────────
      colors: {
        // Base
        black: "#0a0a0a",
        white: "#ffffff",

        // Neutrals
        neutral: {
          50:  "#f9f9f7",
          100: "#f0efed",
          200: "#e4e2de",
          300: "#ccc9c3",
          400: "#a8a49c",
          500: "#7c786e",
          600: "#5a564e",
          700: "#3d3a34",
          800: "#252320",
          900: "#141310",
        },

        // Brand accent — used sparingly
        gold: {
          400: "#d4a843",
          500: "#c49a30",
          600: "#a67f20",
        },
      },

      // ── TYPOGRAPHY ─────────────────────────────────────────
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        xs:   ["0.75rem", { lineHeight: "1.125rem" }],
        sm:   ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["1rem",    { lineHeight: "1.75rem" }],
        lg:   ["1.125rem",{ lineHeight: "1.875rem" }],
        xl:   ["1.25rem", { lineHeight: "2rem" }],
        "2xl":["1.5rem",  { lineHeight: "2.25rem" }],
        "3xl":["1.875rem",{ lineHeight: "2.5rem" }],
        "4xl":["2.25rem", { lineHeight: "2.875rem" }],
        "5xl":["3rem",    { lineHeight: "3.5rem" }],
        "6xl":["3.75rem", { lineHeight: "4.25rem" }],
        "7xl":["4.5rem",  { lineHeight: "5rem" }],
      },

      // ── SPACING ────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
      },

      // ── BORDER RADIUS ──────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
      },

      // ── ANIMATION ──────────────────────────────────────────
      transitionTimingFunction: {
        // Apple's easing curve
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      // ── MAX WIDTH ──────────────────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ── SCREENS ────────────────────────────────────────────
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
