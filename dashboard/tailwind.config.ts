import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mantis: {
          dark: "#050505",
          light: "#F2F3EE", // Furo's specific off-white
          accent: "#CCFF00",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter-tight)', 'sans-serif'],
        serif: ['var(--font-pt-serif)', 'serif'],
        display: ['var(--font-instrument-serif)', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
