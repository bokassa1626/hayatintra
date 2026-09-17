/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        // Système visuel HAYATCOM : bleu digital, contrastes renforcés et surfaces aérées
        "uni-purple": "#2563EB",
        "uni-purple-dark": "#1D4ED8",
        "uni-navy": "#13213C",
        "uni-navy-light": "#22355D",
        "uni-muted": "#667085",
        "uni-surface": "#F5F7FB",
        "uni-border": "#E4E9F2",
        "uni-green": "#16A34A",
        "uni-red": "#DC2626",
        "uni-amber": "#D97706",
      },
      fontFamily: {
        sans: ["Inter", "Aptos", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "22px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.03), 0 8px 24px rgba(16, 24, 40, 0.04)",
        "card-hover": "0 14px 32px rgba(37, 99, 235, 0.12)",
        nav: "0 1px 0 0 #E4E9F2",
      },
    },
  },
  plugins: [],
};
