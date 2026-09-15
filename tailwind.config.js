/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cor de marca do AdCloner Pro (#CEFF00) — usada com equilíbrio: sidebar, estados
        // ativos, botões primários, highlights e detalhes de branding. Nunca em grandes áreas
        // de conteúdo. Escala gerada a partir do tom base para permitir variações de
        // hover/active/disabled sem sair da identidade.
        brand: {
          50: '#fbffe6',
          100: '#f5ffc2',
          200: '#ecff8f',
          300: '#dfff4d',
          400: '#d6fc26',
          500: '#CEFF00',
          600: '#a8d400',
          700: '#7fa300',
          800: '#5c7600',
          900: '#3d4f00',
          DEFAULT: '#CEFF00',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        // Jura é a fonte principal de toda a interface (títulos, menus, botões, cards,
        // métricas, tabelas, formulários e modais) — ver design system em globals.css.
        sans: ['Jura', 'sans-serif'],
        jura: ['Jura', 'sans-serif'],
      },
      borderRadius: {
        // Escala de radius do design system — cantos levemente arredondados, consistentes
        // entre cards, botões, inputs, badges e modais.
        DEFAULT: '0.5rem',
        'ds-sm': '0.375rem',
        'ds-md': '0.5rem',
        'ds-lg': '0.75rem',
        'ds-xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 