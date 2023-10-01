/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.vue",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'custom': '30px',  
        'larger': '1.5rem', 
        'small': "16px",
        'smaller': "14px",
        "middle": "20px"
      },
    },
   
  },
  plugins: [],
}

