import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        valentine: {
          "color-scheme": "light",
          primary: "oklch(65% 0.241 354.308)",
          "primary-content": "oklch(100% 0 0)",
          secondary: "oklch(62% 0.265 303.9)",
          "secondary-content": "oklch(97% 0.014 308.299)",
          accent: "oklch(82% 0.111 230.318)",
          "accent-content": "oklch(39% 0.09 240.876)",
          neutral: "oklch(40% 0.153 2.432)",
          "neutral-content": "oklch(89% 0.061 343.231)",
          "base-100": "oklch(97% 0.014 343.198)",
          "base-200": "oklch(94% 0.028 342.258)",
          "base-300": "oklch(89% 0.061 343.231)",
          "base-content": "oklch(52% 0.223 3.958)",
          info: "oklch(86% 0.127 207.078)",
          "info-content": "oklch(44% 0.11 240.79)",
          success: "oklch(84% 0.143 164.978)",
          "success-content": "oklch(43% 0.095 166.913)",
          warning: "oklch(75% 0.183 55.934)",
          "warning-content": "oklch(26% 0.079 36.259)",
          error: "oklch(63% 0.237 25.331)",
          "error-content": "oklch(97% 0.013 17.38)",
          "--rounded-box": "2rem",
          "--rounded-btn": "2rem",
          "--rounded-badge": "2rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
  },
} satisfies Config;

export default config;