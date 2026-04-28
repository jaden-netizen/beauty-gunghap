/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    { pattern: /bg-(night|gold|cream|ink|wood|fire|earth|metal|water)/ },
    { pattern: /text-(night|gold|cream|ink|wood|fire|earth|metal|water)/ },
    { pattern: /border-(night|gold|cream|ink|wood|fire|earth|metal|water)/ },
  ],
  theme: {
    extend: {
      colors: {
        night:  "var(--night)",
        night2: "var(--night2)",
        gold:   "var(--gold)",
        gold2:  "var(--gold2)",
        gold3:  "var(--gold3)",
        cream:  "var(--cream)",
        cream2: "var(--cream2)",
        cream3: "var(--cream3)",
        ink:    "var(--ink)",
        ink2:   "var(--ink2)",
        ink3:   "var(--ink3)",
        wood:   "var(--wood)",
        fire:   "var(--fire)",
        earth:  "var(--earth)",
        metal:  "var(--metal)",
        water:  "var(--water)",
      },
      fontFamily: {
        serif: ["Noto Serif KR", "serif"],
        sans:  ["Noto Sans KR", "sans-serif"],
        cormorant: ["Cormorant Garamond", "serif"],
      },
    },
  },
  plugins: [],
};
