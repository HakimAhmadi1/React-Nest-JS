import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The single source of truth for the session.
 *
 * There used to be two — this store plus an AuthContext writing to a separate
 * `user` localStorage key. They drifted constantly, which is why signing out
 * only cleared one of them and the app immediately rehydrated the dead session.
 *
 * The access token is held IN MEMORY ONLY. The refresh token lives in an
 * httpOnly cookie that JavaScript cannot read, so a persisted copy of the
 * access token would be pure XSS surface with no benefit.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      roles: [],
      permissions: [],
      accessToken: null,
      /** True until the initial refresh attempt settles. */
      bootstrapping: true,

      isAuthenticated: () => Boolean(get().accessToken),

      setAccessToken: (accessToken) => set({ accessToken }),

      setSession: ({ user, roles, permissions, accessToken }) =>
        set({
          user,
          roles: roles ?? [],
          permissions: permissions ?? [],
          accessToken,
          bootstrapping: false,
        }),

      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : state.user,
        })),

      /** Local-only teardown. Use `logout()` from useAuth to also tell the server. */
      clearSession: () =>
        set({
          user: null,
          roles: [],
          permissions: [],
          accessToken: null,
          bootstrapping: false,
        }),

      setBootstrapping: (bootstrapping) => set({ bootstrapping }),

      hasRole: (role) => {
        const roles = get().roles;
        return Array.isArray(role)
          ? role.some((r) => roles.includes(r))
          : roles.includes(role);
      },

      hasPermission: (permission) => {
        const permissions = get().permissions;
        return Array.isArray(permission)
          ? permission.some((p) => permissions.includes(p))
          : permissions.includes(permission);
      },
    }),
    {
      name: "auth-storage",
      // `accessToken` is intentionally absent: it is re-obtained on load by
      // exchanging the refresh cookie. The rest is cached so the shell can
      // paint immediately instead of flashing a signed-out state.
      partialize: (state) => ({
        user: state.user,
        roles: state.roles,
        permissions: state.permissions,
      }),
    },
  ),
);

/* ── Selector hooks (reactive, unlike the old getState() helpers) ─────── */

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => Boolean(s.accessToken));
export const useIsBootstrapping = () => useAuthStore((s) => s.bootstrapping);
