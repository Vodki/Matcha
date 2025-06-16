import type { Config } from "tailwindcss";
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  // @ts-expect-error: daisyui is not part of Tailwind's default UserConfig
  daisyui: {
    themes: [
      {
        valentine: {
          "primary": "#e96d7b",
          "primary-content": "#ffffff",
          "secondary": "#9e579d",
          "secondary-content": "#f9a8d4",
          "accent": "#8ac6d1",
          "accent-content": "#233142",
          "neutral": "#6c3483",
          "neutral-content": "#ffffff",
          "base-100": "#ffe6eb",
          "base-200": "#fff3f6",
          "base-300": "#fbc3bc",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      "light", // ou d'autres thèmes si tu veux
    ],
  },
};

export default config;