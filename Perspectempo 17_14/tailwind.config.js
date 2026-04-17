/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Chrome de UI — off-white quente + grafites levemente azulados.
        ink: {
          950: '#0a0c10',
          900: '#0e1014',
          800: '#161a21',
          700: '#1f232c',
          600: '#2a2f3a',
          500: '#3a4050',
          400: '#6a7080',
          300: '#8a8f99',
          200: '#b6bac4',
          100: '#ece8df', // off-white quente, nunca puro
        },
        // Accent único — usado para "agora", "esta semana", botão primário.
        gold: {
          DEFAULT: '#c9a96a',
          dim:     '#8a7548',
          soft:    '#c9a96a33',
        },
        // Semântica de classificação — terrosas, não berrantes.
        ideal:   '#7aa884', // sálvia, verde calmo
        fruicao: '#d4a373', // terracota suave
        oficio:  '#7d92b3', // azul-aço
        deriva:  '#6b6f78', // bruma neutra
        // Alerta de excesso — ocre avermelhado, não vermelho puro.
        overflow: '#c97e5e',
      },
    },
  },
  plugins: [],
};
