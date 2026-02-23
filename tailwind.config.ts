import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        celeste: {
          50: "#e6f4ff",
          100: "#b3e0ff",
          200: "#80ccff",
          300: "#4db8ff",
          400: "#1aa3ff",
          500: "#0095e6",
          600: "#0077b8",
          700: "#005a8a",
          800: "#003d5c",
          900: "#00202e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
