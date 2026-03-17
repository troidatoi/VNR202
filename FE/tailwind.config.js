/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Philosophy theme colors - Architecture Portfolio palette
        primary: {
          DEFAULT: '#3D2914', // Dark brown
          50: '#FAF7F0',   // Very light cream
          100: '#F5F1E8',  // Light cream
          200: '#E8DCC0',  // Warm beige
          300: '#D4C4A0',  // Medium beige
          400: '#B8A082',  // Darker beige
          500: '#A0845C',  // Brown-gold
          600: '#8B6914',  // Deep gold-brown
          700: '#6B4E0A',  // Dark brown
          800: '#3D2914',  // Very dark brown
          900: '#2C1810',  // Darkest brown
        },
        background: {
          DEFAULT: '#FAF7F0', // Light cream background
        },
        secondary: {
          DEFAULT: '#A0845C', // Brown-gold
          50: '#F9F7F4',
          100: '#F2EDE6',
          200: '#E5D8C7',
          300: '#D8C3A8',
          400: '#CBAE89',
          500: '#BE996A',
          600: '#A0845C',
          700: '#7A6347',
          800: '#544232',
          900: '#2E211D',
        },
        accent: {
          DEFAULT: '#8B6914', // Deep gold-brown
          50: '#FDF9F3',
          100: '#FBF3E7',
          200: '#F5E1C3',
          300: '#EFCF9F',
          400: '#E9BD7B',
          500: '#E3AB57',
          600: '#D49533',
          700: '#B07A1F',
          800: '#8C5F0B',
          900: '#684400',
        },
        success: {
          DEFAULT: '#8B6914', // Philosophy green-brown
        },
        danger: {
          DEFAULT: '#8C5F0B', // Warm brown danger
        },
        warning: {
          DEFAULT: '#D49533', // Golden warning
        },
        info: {
          DEFAULT: '#A0845C', // Brown-gold info
        },
        dark: {
          DEFAULT: '#2C1810', // Darkest brown
        },
        light: {
          DEFAULT: '#FAF7F0', // Very light cream
        },
        bodytext: '#544232', // Dark brown text
        lightprimary: '#F5F1E8', // Light cream
        lighthover: '#E8DCC0', // Warm beige hover
        darkmuted: '#6B4E0A', // Dark brown muted
        slot: {
          'available-bg': '#ffffff',
          'available-hover-bg': '#f3f4f6',
          'unavailable-bg': '#ffe4e6',
          'booked-bg': '#ffe4e6',
          'past-bg': '#e5e7eb',
          'available-ring': '#22c55e',
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '30': '30px',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: 0 },
          'to': { opacity: 1 },
        },
        slideInRight: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideInRight: 'slideInRight 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
