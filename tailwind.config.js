/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Brand colors
    'bg-brand-50', 'bg-brand-100', 'bg-brand-200', 'bg-brand-300', 'bg-brand-400',
    'bg-brand-500', 'bg-brand-600', 'bg-brand-700', 'bg-brand-800', 'bg-brand-900', 'bg-brand-950',
    // Text colors
    'text-brand-50', 'text-brand-100', 'text-brand-200', 'text-brand-300', 'text-brand-400',
    'text-brand-500', 'text-brand-600', 'text-brand-700', 'text-brand-800', 'text-brand-900', 'text-brand-950',
    // Border colors
    'border-brand-50', 'border-brand-100', 'border-brand-200', 'border-brand-300', 'border-brand-400',
    'border-brand-500', 'border-brand-600', 'border-brand-700', 'border-brand-800', 'border-brand-900', 'border-brand-950',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#262626',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#D9E25C', // Updated from Nike red to lime green
          foreground: '#262626', // Updated foreground to dark for better contrast
        },
        brand: {
          50: '#f9f9f9',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#D9E25C', // Updated from Nike red to lime green
          400: '#C4CC53',
          500: '#AFB64A',
          600: '#9AA041',
          700: '#858A38',
          800: '#70742F',
          900: '#5B5E26',
          950: '#46481D',
        },
        // Additional semantic color sets
        accent: {
          DEFAULT: '#D9E25C', // Updated from Nike red to lime green
          light: '#E4EA7F',
          dark: '#AFB64A',
        },
        // UI background colors
        surface: {
          light: '#FFFFFF',    // Pure white for light mode
          dark: '#000000',     // Pure black for dark mode
          muted: '#F5F5F5',
        },
        // Text colors - Nike-inspired approach with #262626 as primary
        text: {
          primary: '#262626',  // Nike standard black for text
          secondary: '#555555', // 67% black
          muted: '#717171',    // 56% black
          inverted: '#FFFFFF', // Pure white
        },
        // Add the background color as a standalone color too
        background: {
          light: '#FFFFFF',    // Pure white for light mode
          dark: '#000000',     // Pure black for dark mode
        },
        // Nike-inspired grayscale
        nike: {
          black: '#262626',    // Nike standard black
          gray: {
            100: '#F5F5F5',    // 4% black
            200: '#E5E5E5',    // 10% black
            300: '#D4D4D4',    // 17% black
            400: '#A3A3A3',    // 36% black
            500: '#737373',    // 55% black
            600: '#525252',    // 68% black
            700: '#404040',    // 75% black
            800: '#262626',    // 85% black
            900: '#171717',    // 91% black
          }
        }
      },
      // Add complementary design tokens
      borderRadius: {
        'brand': '0px',        // Nike uses sharp corners
      },
      boxShadow: {
        'brand': 'none',       // Minimal shadows for a clean look
      },
    },
  },
  plugins: [],
} 