// Configuration variables
// We use Vite's import.meta.env to access environment variables.
// In production, these should be replaced by the built environment variables or fallback to the production domain.

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://cronowork.app/api' : 'http://localhost:3500');
export const APP_URL = import.meta.env.VITE_APP_URL || (import.meta.env.PROD ? 'https://cronowork.app' : 'http://localhost:5173');
