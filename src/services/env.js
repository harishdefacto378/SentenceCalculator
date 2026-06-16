const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.PUBLIC_API_BASE_URL ||
  'http://localhost:5000';

const IS_PRODUCTION = import.meta.env.PUBLIC_ENV === 'production';

export const config = {
  API_BASE_URL,
  TIMEOUT: IS_PRODUCTION ? 15000 : 10000,
};

export default config;
