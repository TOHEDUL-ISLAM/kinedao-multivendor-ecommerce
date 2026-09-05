import { db } from "@kineDao.com/db";
import * as schema from "@kineDao.com/db/schema/auth";
import { env } from "@kineDao.com/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sendEmail } from "./email";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");


const isSecureOrigin = env.BETTER_AUTH_URL.startsWith("https://");
const cookieSameSite = "lax"; // Using lax because Vercel and Render share the same apex domain or use a proxy
const frontendBaseUrl = normalizeBaseUrl(env.WEB_ORIGIN);
const adminFrontendBaseUrl = frontendBaseUrl;
const corsOriginBaseUrl = frontendBaseUrl;
const additionalCorsOrigins: string[] = [];
const trustedFrontendUrls = Array.from(
  new Set([
    frontendBaseUrl,
    adminFrontendBaseUrl,
    corsOriginBaseUrl,
    ...additionalCorsOrigins,
  ])
);
const trustedFrontendOrigins = new Set(
  trustedFrontendUrls.map((url) => new URL(url).origin)
);

const getSafeFrontendCallback = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value, frontendBaseUrl);
    return trustedFrontendOrigins.has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
};

const buildFrontendUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, frontendBaseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  user: {
    additionalFields: {
      roles: {
        type: "string[]",
        required: true,
        input: false,
        defaultValue: ["customer"],
      },
    },
  },
  trustedOrigins: Array.from(
    new Set([
      ...trustedFrontendUrls,
      normalizeBaseUrl(env.BETTER_AUTH_URL),
    ])
  ),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      console.log("[AUTH] sendResetPassword callback triggered!");
      console.log("[AUTH] User:", user.email);
      console.log("[AUTH] Reset URL (original):", url);

      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const token = pathParts[pathParts.length - 1] || "";
      const frontendUrl = buildFrontendUrl("/reset-password", {
        token,
      });
      console.log("[AUTH] Reset URL (frontend):", frontendUrl);

      // Fire-and-forget to prevent timing attacks (per Better Auth docs)
      void sendEmail({
        to: user.email,
        subject: "Reset your password - KineDao",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #4F46E5; margin-top: 0;">Password Reset Request</h1>
                <p>Hi ${user.name || "there"},</p>
                <p>We received a request to reset your password for your KineDao account. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${frontendUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${frontendUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 1 hour for security reasons.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `,
      }).catch(console.error);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log("[AUTH] sendVerificationEmail callback triggered!");
      console.log("[AUTH] User:", user.email);
      console.log("[AUTH] Verification URL (original):", url);

      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get("token") || "";
      const callbackURL = getSafeFrontendCallback(
        parsedUrl.searchParams.get("callbackURL")
      );
      const frontendUrl = buildFrontendUrl("/verify-email", {
        token,
        callbackURL: callbackURL ?? "",
      });
      console.log("[AUTH] Verification URL (frontend):", frontendUrl);

      // Fire-and-forget to prevent timing attacks (per Better Auth docs)
      sendEmail({
        to: user.email,
        subject: "Verify your email - KineDao",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #4F46E5; margin-top: 0;">Welcome to KineDao!</h1>
                <p>Hi ${user.name},</p>
                <p>Thank you for signing up for KineDao, your trusted marketplace for baby products! To complete your registration, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${frontendUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${frontendUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 24 hours.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't create an account with KineDao, you can safely ignore this email.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `,
      }).catch(console.error);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET
      ? {
          facebook: {
            clientId: env.FACEBOOK_CLIENT_ID,
            clientSecret: env.FACEBOOK_CLIENT_SECRET,
          },
        }
      : {}),
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: cookieSameSite,
      secure: isSecureOrigin,
      httpOnly: true,
    },
  },
  plugins: [],
});
