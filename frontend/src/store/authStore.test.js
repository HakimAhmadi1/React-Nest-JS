import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./authStore";

const SESSION = {
  user: { id: 1, name: "Ada", email: "ada@example.com" },
  roles: ["ADMIN"],
  permissions: ["user.view", "user.edit"],
  accessToken: "token-123",
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    localStorage.clear();
  });

  it("reports authentication from the access token", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    useAuthStore.getState().setSession(SESSION);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it("clears every field on teardown", () => {
    useAuthStore.getState().setSession(SESSION);
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.permissions).toEqual([]);
    expect(state.isAuthenticated()).toBe(false);
  });

  it("never persists the access token", () => {
    useAuthStore.getState().setSession(SESSION);

    const persisted = JSON.parse(localStorage.getItem("auth-storage"));
    expect(persisted.state.user).toBeTruthy();
    // The refresh cookie is the durable credential; a persisted access token
    // would be XSS surface for no benefit.
    expect(persisted.state.accessToken).toBeUndefined();
  });

  it("does not leave a second copy of the session behind", () => {
    useAuthStore.getState().setSession(SESSION);
    useAuthStore.getState().clearSession();

    // The old AuthContext wrote here; nothing must resurrect a dead session.
    expect(localStorage.getItem("user")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("checks roles and permissions", () => {
    useAuthStore.getState().setSession(SESSION);
    const state = useAuthStore.getState();

    expect(state.hasRole("ADMIN")).toBe(true);
    expect(state.hasRole("SUPER_ADMIN")).toBe(false);
    expect(state.hasRole(["SUPER_ADMIN", "ADMIN"])).toBe(true);
    expect(state.hasPermission("user.edit")).toBe(true);
    expect(state.hasPermission("user.delete")).toBe(false);
  });

  it("merges partial user updates", () => {
    useAuthStore.getState().setSession(SESSION);
    useAuthStore.getState().updateUser({ name: "Ada Lovelace" });

    expect(useAuthStore.getState().user).toEqual({
      id: 1,
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });
});
