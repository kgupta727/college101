import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      white: '#ffffff',
      forest: {
        '50': '#f4f7f5',
        '100': '#e8f0ea',
        '200': '#c5dccb',
        '300': '#5E8E44',
        '400': '#497035',
        '500': '#28502F',
        '600': '#204028',
        '700': '#183020',
      },
      sand: {
        '50': '#fefdfb',
        '100': '#F0CFA9',
        '200': '#e8c09a',
        '300': '#deb08a',
      },
      coral: {
        '50': '#fef5f3',
        '100': '#EBBBA7',
        '200': '#E08B76',
        '300': '#EF6442',
        '400': '#CE4B27',
        '500': '#b83f20',
      },
    },
    extend: {
      backgroundColor: {
        'off-white': '#faf9f7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
