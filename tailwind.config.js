/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        background: '#FFFFFF',
        success: '#10B981',
        error: '#EF4444',
      },
      borderRadius: {
        xl: '12px',
      }
    },
  },
  plugins: [],
};
