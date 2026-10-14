/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#dce4ff",
          200: "#bfceff",
          400: "#718cff",
          500: "#4b68f5",
          600: "#3852df",
          700: "#2e43bb",
          800: "#283a91",
        },
      },
    },
  },
  plugins: [],
};
