import { z } from "zod";

// =====================
// Newsletter Types
// =====================

export const newsletterSubscribeSchema = z.object({
  email: z.string().email(),
});

export type NewsletterSubscribeRequest = z.infer<typeof newsletterSubscribeSchema>;

export const newsletterUnsubscribeSchema = z.object({
  email: z.string().email(),
});

export type NewsletterUnsubscribeRequest = z.infer<typeof newsletterUnsubscribeSchema>;

export interface NewsletterResponse {
  success?: boolean;
  message?: string;
  error?: string;
}
