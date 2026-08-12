import { z } from "zod";

/**
 * Client-side mirrors of the backend DTO rules.
 *
 * Kept deliberately identical to `backend/src/common/dto/users.dto.ts` so the
 * user is told about a weak password before the round-trip, not after a 400.
 */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a digit");

const email = z.string().min(1, "Email is required").email("Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  address: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  zipCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
});

export const adminUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email,
  password: password.optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "SUPPORT", "SUBSCRIBER"]),
});
