import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema } from "./validation";

describe("validation schemas", () => {
  it("rejects a password that is too short", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "Short1",
      confirmPassword: "Short1",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/at least 8 characters/);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords and points at the right field", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "Password123",
      confirmPassword: "Password124",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("accepts a valid registration", () => {
    expect(
      registerSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed email on login", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("enforces the same password policy on reset as on registration", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "weak",
        confirmPassword: "weak",
      }).success,
    ).toBe(false);
  });
});
