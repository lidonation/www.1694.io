/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1840px',
        '4xl': '2160px',
      },
      spacing: {
        '1/2': '50%',
        '1/3': '33.333333%',
        '1/4': '25%',
        '2/3': '66.666667%',
        '3/4': '75%',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
