/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        extrabold: ['Inter_800ExtraBold'],
      },
      colors: {
        primary: '#00C4A8',
        'primary-dark': '#009E87',
        orange: '#E07A3A',
        bg: '#F5F5F0',
        'donor-bg': '#E0F7F4',
        'org-bg': '#FDF0E8',
        'text-dark': '#1a1a1a',
        'text-muted': '#6b7280',
        'text-light': '#9ca3af',
        boxShadow: {
          card: '0px 2px 12px rgba(0, 0, 0, 0.08)',
        }
      }
    }
  },
  plugins: [],
};