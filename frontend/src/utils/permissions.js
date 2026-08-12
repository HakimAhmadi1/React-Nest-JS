import { useAuthStore } from "@/store/authStore";

/** Roles allowed into the admin portal. Mirrors the backend's ADMIN_ROLES. */
export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "SUPPORT"];

const matches = (list, wanted) =>
  Array.isArray(wanted) ? wanted.some((w) => list.includes(w)) : list.includes(wanted);

/*
 * Hooks, not getState() snapshots.
 *
 * The previous helpers read useAuthStore.getState() at call time with no
 * subscription, so admin links and action buttons could stay hidden after
 * sign-in until some unrelated state change forced a re-render.
 */

export const useCanAccess = (permission) =>
  useAuthStore((s) => matches(s.permissions, permission));

export const useHasRole = (role) => useAuthStore((s) => matches(s.roles, role));

/** The single definition of "is an admin" — there were four, and they disagreed. */
export const useIsAdmin = () => useAuthStore((s) => matches(s.roles, ADMIN_ROLES));

/* Non-reactive variants, for use outside React (event handlers, guards). */
export const canAccess = (permission) =>
  matches(useAuthStore.getState().permissions, permission);

export const hasRole = (role) => matches(useAuthStore.getState().roles, role);

export const isAdmin = () => matches(useAuthStore.getState().roles, ADMIN_ROLES);
