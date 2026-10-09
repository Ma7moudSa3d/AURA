import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0D", surface: "#121214", surface2: "#17171A",
        cream: "#F5F1E8", gold: "#D6B25E", gold2: "#B88A3B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        arabic: ["var(--font-arabic)", "Cairo", "sans-serif"],
      },
      boxShadow: { glow: "0 0 24px rgba(214,178,94,.25)" },
      backgroundImage: { gold: "linear-gradient(135deg,#D6B25E,#B88A3B)" },
    },
  },
  plugins: [],
} satisfies Config;
