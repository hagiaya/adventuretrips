/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FF3366', // Vibrant Pink/Reddish Pink
                    50: '#FFF0F5',
                    100: '#FFE4EB',
                    200: '#FFC2D6',
                    300: '#FF94B8',
                    400: '#FF5C91',
                    500: '#FF3366',
                    600: '#D91A4D',
                    700: '#B00D39',
                    800: '#8A082B',
                    900: '#690520',
                },
                secondary: {
                    DEFAULT: '#FFD700', // Bright Gold/Yellow
                    50: '#FFFAEB',
                    100: '#FFF5C2',
                    200: '#FFEB85',
                    300: '#FFE047',
                    400: '#FFD700', // Gold
                    500: '#FAC000',
                    600: '#C79600',
                    700: '#946E00',
                },
                dark: {
                    DEFAULT: '#111827',
                    900: '#000000',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
