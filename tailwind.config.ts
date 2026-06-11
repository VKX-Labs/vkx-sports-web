import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F172A",
          card: "#1E293B",
          accent: "#22C55E",
          accentHover: "#16A34A",
          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8"
        },
      },
    },
  },
  plugins: [],
};
export default config;