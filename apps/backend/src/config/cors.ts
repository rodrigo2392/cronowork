// Centralized CORS origin resolution.
// Set CORS_ORIGINS (comma-separated) to control the allowed origins explicitly.
// Otherwise we fall back to FRONTEND_URL / APP_URL plus the local dev defaults.

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5750',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5750',
];

export function getCorsOrigins(): string[] {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const origins = [...DEFAULT_DEV_ORIGINS];
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
  if (process.env.APP_URL) origins.push(process.env.APP_URL);
  return Array.from(new Set(origins));
}
