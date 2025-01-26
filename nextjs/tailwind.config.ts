import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
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
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Фоны
    'bg-blue-50',
    'bg-blue-600',
    'bg-blue-700',
    'bg-white',
    'bg-gray-50',
    'bg-gray-100',
    // Текст
    'text-white',
    'text-gray-900',
    'text-blue-600',
    // Границы
    'border',
    'border-gray-300',
    'border-blue-500',
    // Отступы
    'px-8',
    'py-3',
    'space-x-4',
    // Скругления
    'rounded-md',
    // Состояния
    'hover:bg-blue-600',
    'hover:bg-blue-700',
    'hover:bg-gray-50',
    'hover:text-blue-600',
    // Размеры шрифта
    'text-lg',
    // Начертание
    'font-medium',
    // Анимации
    'animate-fade-in'
  ],
};

export default config;
