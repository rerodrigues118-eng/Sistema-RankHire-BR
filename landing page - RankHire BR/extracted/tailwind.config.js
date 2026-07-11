/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rh: {
          navy: "#06080F",
          surface: "#0D1117",
          card: "#161B22",
          border: "#21262D",
          green: "#06D6A0",
          "green-dim": "#0a2a24",
          gold: "#D4AF37",
          "gold-dim": "#1f1a08",
          white: "#F0F6FC",
          gray: "#8B949E",
          muted: "#484F58",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        badge: "6px",
        btn: "8px",
      },
      spacing: {
        13: "3.25rem",
        18: "4.5rem",
      },
      keyframes: {
        "marquee-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-right": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "border-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fill-bar": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "marquee-left": "marquee-left 40s linear infinite",
        "marquee-right": "marquee-right 55s linear infinite",
        float: "float 5s ease-in-out infinite",
        "border-spin": "border-spin 4s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
