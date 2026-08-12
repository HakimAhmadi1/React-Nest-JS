import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // Previously produced a literal "undefined/" baseURL and a wall of 404s.
  throw new Error(
    "VITE_API_URL is not set. Copy .env.example to .env and set it (e.g. http://localhost:3003/api).",
  );
}

const api = axios.create({
  baseURL: API_URL.endsWith("/") ? API_URL : `${API_URL}/`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  // Required: the refresh token lives in an httpOnly cookie that the browser
  // only attaches when credentials are enabled.
  withCredentials: true,
});

/* ── Request: attach the in-memory access token ───────────────────────── */

api.interceptors.request.use((config) => {
  if (config.requiresAuth !== false) {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // Let axios compute the multipart boundary itself. Setting this header by
  // hand strips the boundary and the server cannot parse the body.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

/* ── Response: unwrap the envelope, refresh once on 401 ───────────────── */

/**
 * Single-flight refresh: N concurrent 401s trigger one /auth/refresh call and
 * all wait on the same promise.
 */
let refreshPromise = null;

function refreshAccessToken() {
  refreshPromise ??= axios
    .post(`${api.defaults.baseURL}auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      const token = res.data?.data?.accessToken ?? res.data?.accessToken;
      if (!token) throw new Error("No access token in refresh response");
      useAuthStore.getState().setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  // The backend wraps success responses in { success, statusCode, message, data }.
  (response) => response.data?.data ?? response.data,

  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Never try to refresh the refresh call itself.
    const isAuthEndpoint = /\/auth\/(refresh|login|register|logout)$/.test(
      original?.url ?? "",
    );

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        // The session is genuinely over. Clear local state, but do NOT hard
        // navigate — React Router handles the redirect, which keeps the app
        // from reloading into a half-restored session.
        useAuthStore.getState().clearSession();
        return Promise.reject(normalizeError(error));
      }
    }

    /*
     * 403 is deliberately NOT a logout. It means "signed in, but this action
     * needs a role you don't have" — the previous behaviour destroyed the
     * session on every permission denial.
     */
    return Promise.reject(normalizeError(error));
  },
);

/** Flattens the backend error envelope into a predictable Error. */
function normalizeError(error) {
  const payload = error.response?.data;

  const err = new Error(
    payload?.message || error.message || "An unexpected error occurred",
  );
  // `statusCode` is what the envelope uses; `status` was always undefined.
  err.status = payload?.statusCode ?? error.response?.status ?? 0;
  err.errors = payload?.errors ?? [];
  err.isNetworkError = !error.response;
  return err;
}

export default api;

/**
 * Thin wrapper that THROWS on failure.
 *
 * The previous version caught errors and returned `{ success: false }`, so no
 * React Query `onError` could ever fire and `onSuccess` ran on failed
 * mutations — producing "Saved!" toasts for 400 responses.
 */
export const apiRequest = ({
  method,
  endpoint,
  data,
  params,
  headers = {},
  requiresAuth = true,
  signal,
}) => api({ method, url: endpoint, data, params, headers, requiresAuth, signal });

export const getApi = (endpoint, params, auth = true, headers = {}, signal) =>
  apiRequest({ method: "GET", endpoint, params, requiresAuth: auth, headers, signal });

export const postApi = (endpoint, data, params = null, auth = true, headers = {}) =>
  apiRequest({ method: "POST", endpoint, data, params, requiresAuth: auth, headers });

export const putApi = (endpoint, data, params = null, auth = true, headers = {}) =>
  apiRequest({ method: "PUT", endpoint, data, params, requiresAuth: auth, headers });

export const patchApi = (endpoint, data, params = null, auth = true, headers = {}) =>
  apiRequest({ method: "PATCH", endpoint, data, params, requiresAuth: auth, headers });

export const deleteApi = (endpoint, params, auth = true, headers = {}) =>
  apiRequest({ method: "DELETE", endpoint, params, requiresAuth: auth, headers });
