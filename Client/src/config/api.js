// Centralized API configuration
// Supports VITE_SPREADSHEET_API, VITE_API_URL, or VITE_BACKEND_URL
const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_SPREADSHEET_API ||
  'https://back-it.onrender.com';

// Clean and normalize base URL (e.g. "https://back-it.onrender.com")
export const API_BASE_URL = rawUrl
  .replace(/\/api\/spreadsheet\/?$/, '')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

// Spreadsheet API endpoint
export const SPREADSHEET_API_URL = `${API_BASE_URL}/api/spreadsheet`;

// WebSocket URL (http -> ws, https -> wss)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/i, (match) =>
  match.toLowerCase() === 'https' ? 'wss' : 'ws'
);

export default {
  API_BASE_URL,
  SPREADSHEET_API_URL,
  WS_BASE_URL,
};
