/* eslint-disable @typescript-eslint/no-require-imports */
// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class", // required for dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // make sure all components are included
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // if you're using `tw-animate-css`
  ],

};
export default config;
