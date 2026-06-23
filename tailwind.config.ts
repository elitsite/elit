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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Gold accent taken from the Elite Bloemen logo.
        brand: {
          DEFAULT: "#b8924f",
          light: "#cbb27e",
          dark: "#9a7a3f",
        },
        gold: {
          DEFAULT: "#b8924f",
          light: "#cbb27e",
          dark: "#9a7a3f",
        },
        cream: "#f7f4ef",
        ink: "#262220",
        taupe: {
          DEFAULT: "#a89a8c",
          dark: "#8c7e70",
          light: "#c9bfb4",
        },
        blush: "#e8d9d1",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1280px",
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
