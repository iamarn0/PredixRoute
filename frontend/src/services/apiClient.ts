import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { paths } from '../routes/paths';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const AUTH_SKIP_REFRESH = [
  '/auth/me',
  '/auth/refresh',
  '/auth/logout',
  '/auth/login',
  '/auth/user/login',
  '/auth/admin/login',
  '/auth/user/register',
  '/auth/admin/register',
];

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return AUTH_SKIP_REFRESH.some((path) => url.includes(path));
}

function isProtectedAppRoute() {
  const path = window.location.pathname;
  return path.startsWith('/app') || path.startsWith('/admin');
}

function loginRedirectPath() {
  return window.location.pathname.startsWith('/admin') ? paths.admin.login : paths.customer.login;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
      return true;
    } catch {
      await axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshed = await tryRefreshSession();

    if (refreshed) {
      return apiClient(original);
    }

    if (isProtectedAppRoute()) {
      window.location.href = loginRedirectPath();
    }

    return Promise.reject(error);
  },
);
