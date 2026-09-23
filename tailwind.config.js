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
        // Antes era um espelho exato do cinza padrão do Tailwind ("gray"), que tem um viés
        // frio/azulado perceptível nos tons mais escuros — só ficou visível de fato quando o
        // modo escuro (dark:bg-gray-900/800 etc., usado em toda a interface) passou a ser
        // alcançável de verdade (ver contexts/ThemeContext.tsx). Trocado pela escala "neutral"
        // do Tailwind — R=G=B em cada tom, sem matiz nenhum — pra tirar o azulado tanto no claro
        // quanto no escuro sem precisar tocar nenhuma classe `gray-*`/`dark:gray-*` do resto do
        // app (elas continuam existindo, só passam a apontar pra esses valores).
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
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