export const API_BASE_URL: string =
  (import.meta.env.PUBLIC_API_BASE_URL as string) || 'http://localhost:3000';

export const ENV: string =
  (import.meta.env.PUBLIC_ENV as string) || 'development';

export default { API_BASE_URL, ENV };


