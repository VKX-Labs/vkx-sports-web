/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- Mudança aqui! Adicionamos o novo pacote com aspas
    autoprefixer: {},
  },
};

export default config;