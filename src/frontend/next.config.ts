import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // La web actua ademas como BFF: agrega llamadas y custodia los tokens en
  // cookies httpOnly, de modo que el navegador nunca habla directo con la API.
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  },
};

export default config;
