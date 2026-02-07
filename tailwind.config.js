/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
   extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#004E89",
        success: "#06A77D",
        danger: "#D62828",
        warning: "#F77F00",
      },
    },
  },
  corePlugins: {
    preflight: false, // now allowed in v3!
  },
  plugins: [],
};
