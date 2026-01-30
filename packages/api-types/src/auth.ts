import { z } from "zod";

// =====================
// Auth Request/Response Types
// =====================

export const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  callbackURL: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export type SignUpRequest = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export interface AuthResponse {
  message?: string;
  error?: string;
}
