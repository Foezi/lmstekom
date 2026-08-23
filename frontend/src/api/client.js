import axios from 'axios';

export const TOKEN_KEY = 'lms_token';
export const USER_KEY = 'lms_user';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.error?.code;
    const isAuthCall = err.config?.url?.startsWith('/auth/login');
    if ((status === 401 || code === 'UNAUTHORIZED') && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const apiError = (err, fallback = 'Terjadi kesalahan') =>
  err.response?.data?.error?.message ||
  (err.response?.data?.error?.details
    ? `${fallback}: ${err.response.data.error.details.map((d) => d.pesan ?? d.message).join('; ')}`
    : err.message || fallback);
