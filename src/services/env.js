const configs = {
  development: {
    API_BASE_URL: 'http://localhost:3001',
    TIMEOUT: 10000,
  },
  staging: {
    API_BASE_URL: 'https://staging-api.sentencecalculator.com',
    TIMEOUT: 15000,
  },
  production: {
    API_BASE_URL: 'https://api.sentencecalculator.com',
    TIMEOUT: 15000,
  },
};

const env = import.meta.env.PUBLIC_ENV || 'development';

export const config = configs[env] ?? configs.development;

export default config;
