/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  
  ],
/* AI Theme Customization */
 theme: {
    extend: {
      colors: {
        ai: {
          bg: "#0B001A",
          surface: "#140028",
          primary: "#7C3AED",
          secondary: "#A855F7",
          accent: "#E879F9",
          cyan: "#22D3EE"
        }
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #1A0033 0%, #3D007A 40%, #9333EA 70%, #E879F9 100%)',
        'ai-glow': 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.35), transparent 60%)'
      }
    }
  },
  plugins: [],
}
