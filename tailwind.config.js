/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3357e6",
          600: "#2544c2",
          700: "#1c3699",
        },
      },
    },
  },
  plugins: [],
};
