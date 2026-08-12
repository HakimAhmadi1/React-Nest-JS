import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { getApi, postApi } from "@/services/api";

/**
 * Drop-in replacement for the old AuthContext, backed by the Zustand store.
 *
 * Kept as a hook rather than a provider so there is exactly one place session
 * state can live.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const permissions = useAuthStore((s) => s.permissions);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const loading = useAuthStore((s) => s.bootstrapping);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const updateUser = useAuthStore((s) => s.updateUser);

  const login = useCallback(
    async (credentials) => {
      const data = await postApi("auth/login", credentials, null, false);
      setSession(data);
      return data;
    },
    [setSession],
  );

  const register = useCallback(
    async (details) => {
      const data = await postApi("auth/register", details, null, false);
      setSession(data);
      return data;
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      // Must reach the server, or the refresh-token family stays valid and
      // whoever holds the cookie keeps a working session.
      await postApi("auth/logout", null, null, false);
    } catch {
      // Already-expired session: local teardown below is still correct.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return {
    user,
    roles,
    permissions,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser: async () => {
      const me = await getApi("auth/me");
      updateUser(me);
      return me;
    },
  };
}

/**
 * Restores the session on page load by exchanging the httpOnly refresh cookie
 * for a fresh access token.
 *
 * This replaces reading a token out of localStorage — the mechanism that let a
 * revoked or expired token be treated as a live session indefinitely.
 */
export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const clearSession = useAuthStore((s) => s.clearSession);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in development.
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    (async () => {
      try {
        const { accessToken } = await postApi("auth/refresh", null, null, false);
        if (cancelled) return;

        useAuthStore.getState().setAccessToken(accessToken);
        const me = await getApi("auth/me");
        if (cancelled) return;

        setSession({
          user: me,
          roles: me.roles,
          permissions: me.permissions,
          accessToken,
        });
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, setBootstrapping, clearSession]);
}
