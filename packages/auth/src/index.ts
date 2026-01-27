import { db } from "@kineDao.com/db";
import * as schema from "@kineDao.com/db/schema/auth";
import { env } from "@kineDao.com/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "onboarding@resend.dev",
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
                <p>Hi ${user.name},</p>
                <p>We received a request to reset your password for your KineDao account. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${url}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 1 hour for security reasons.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "onboarding@resend.dev",
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
                  <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${url}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 24 hours.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't create an account with KineDao, you can safely ignore this email.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [],
});
