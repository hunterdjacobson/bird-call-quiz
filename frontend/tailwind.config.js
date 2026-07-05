/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        feather: { 
          green: '#3A5A40', 
          cream: '#F4F1DE', 
          orange: '#E07A5F' 
        }
      }
    },
  },
  plugins: [],
}