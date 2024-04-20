/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1840px",
        "4xl": "2160px",
      },
    },
    colors: {
      "dark-blue": "#00123D",
      "dark-indigo": "#242232",
      "button-blue": "#0033ad",
      "bottom-nav-text": "#c7cdd1",
      "top-nav-bg-color": "#f8f8f8",
      "base-wrapper-bg-color": "#f8f8f8",
      "wall-info-txt-color": "#ADAEAD",
      "drep-intro-text-color": " #242232",
      "pale-white": "#f8f8f8",
      "pure-white": "#ffffff",
      "drep-info-bg-color": " #0033ad",
      "custom-blue": " #0033ad",
      "active": "#FF640A",
      "note-form-bg": "#FBFBFF",
      "input-border":'#F1F2F3',
      "text-opt-bg":'#F7F9FB'
    },
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
    },
    width: {
      socialButtons: "40px",
      fullScale: "100%",
      halfScale: "50%",
    },
    height: {
      socialButtons: "40px",
      fullScale: "100%",
      halfScale: "50%",
    },
  },
  plugins: [],
};
