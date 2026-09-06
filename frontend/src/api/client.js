import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export const TOKEN_KEY = 'lms_token';
export const USER_KEY = 'lms_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let activeRequests = 0;

api.interceptors.request.use((config) => {
  if (activeRequests === 0) NProgress.start();
  activeRequests++;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
  return Promise.reject(error);
});

api.interceptors.response.use(
  (res) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      NProgress.done();
    }
    return res;
  },
  (err) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      NProgress.done();
    }
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
