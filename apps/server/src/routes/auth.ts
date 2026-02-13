import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "@kineDao.com/auth";
import { db } from "@kineDao.com/db";
import { account, user } from "@kineDao.com/db/schema/auth";
import { env } from "@kineDao.com/env/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { signUpSchema, forgotPasswordSchema } from "@kineDao.com/api-types/auth";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const parseCommaSeparatedUrls = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      try {
        return [normalizeBaseUrl(new URL(item).toString())];
      } catch {
        return [];
      }
    });

const frontendBaseUrl = normalizeBaseUrl(env.FRONTEND_URL);
const trustedFrontendUrls = Array.from(
  new Set([
    frontendBaseUrl,
    normalizeBaseUrl(env.ADMIN_FRONTEND_URL ?? env.FRONTEND_URL),
    normalizeBaseUrl(env.CORS_ORIGIN),
    ...parseCommaSeparatedUrls(env.CORS_ORIGINS),
  ])
);
const trustedFrontendOrigins = new Set(
  trustedFrontendUrls.map((url) => new URL(url).origin)
);

const resolveBaseUrlFromOrigin = (origin: string | undefined) => {
  if (!origin) {
    return frontendBaseUrl;
  }

  const normalizedOrigin = normalizeBaseUrl(origin);
  return trustedFrontendOrigins.has(normalizedOrigin)
    ? normalizedOrigin
    : frontendBaseUrl;
};

const resolveFrontendUrl = (
  value: string | undefined,
  fallbackPath: string,
  requestOrigin: string | undefined
) => {
  const baseUrl = resolveBaseUrlFromOrigin(requestOrigin);
  const fallback = new URL(fallbackPath, baseUrl).toString();
  if (!value) return fallback;
  try {
    const parsed = new URL(value, baseUrl);
    return trustedFrontendOrigins.has(parsed.origin) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
};

const buildAuthRequest = (path: string, body: unknown, original: Request) => {
  const headers = new Headers(original.headers);
  headers.set("content-type", "application/json");
  headers.delete("content-length");

  return new Request(new URL(path, env.BETTER_AUTH_URL).toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const passwordResetEligibilitySchema = z.object({
  email: z.string().email(),
});

async function getPasswordCapabilityByEmail(email: string): Promise<{
  userExists: boolean;
  hasCredentialAccount: boolean;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = await db
    .select({ providerId: account.providerId, password: account.password })
    .from(user)
    .innerJoin(account, eq(account.userId, user.id))
    .where(sql`lower(${user.email}) = ${normalizedEmail}`);

  if (accounts.length === 0) {
    return { userExists: false, hasCredentialAccount: false };
  }

  return {
    userExists: true,
    hasCredentialAccount: accounts.some(
      (row) =>
        row.providerId === "credential" &&
        typeof row.password === "string" &&
        row.password.length > 0
    ),
  };
}

// POST /api/auth/sign-up - Custom sign-up handler
// POST /api/auth/forgot-password - Custom forgot password handler
const authRouter = new Hono()
  .post("/sign-up", zValidator("json", signUpSchema), async (c) => {
    const data = c.req.valid("json");
    const normalizedEmail = data.email.trim().toLowerCase();
    const callbackURL = resolveFrontendUrl(
      data.callbackURL,
      "/login",
      c.req.header("origin")
    );

    const request = buildAuthRequest(
      "/api/auth/sign-up/email",
      {
        name: data.name,
        email: normalizedEmail,
        password: data.password,
        callbackURL,
        rememberMe: data.rememberMe,
      },
      c.req.raw
    );

    return auth.handler(request);
  })
  .post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
    const data = c.req.valid("json");
    const normalizedEmail = data.email.trim().toLowerCase();

    const { userExists, hasCredentialAccount } =
      await getPasswordCapabilityByEmail(normalizedEmail);

    // If account exists but is OAuth-only (e.g. Google), block password reset.
    // Once user sets a password from account settings, providerId "credential"
    // exists and reset becomes allowed.
    if (userExists && !hasCredentialAccount) {
      return c.json(
        {
          message:
            "This account uses Google sign-in. Please set a password from My Account first.",
        },
        400
      );
    }

    const redirectTo = resolveFrontendUrl(
      data.redirectTo,
      "/reset-password",
      c.req.header("origin")
    );

    const request = buildAuthRequest(
      "/api/auth/request-password-reset",
      {
        email: normalizedEmail,
        redirectTo,
      },
      c.req.raw
    );

    return auth.handler(request);
  })
  .post(
    "/password-reset-eligibility",
    zValidator("json", passwordResetEligibilitySchema),
    async (c) => {
      const data = c.req.valid("json");
      const normalizedEmail = data.email.trim().toLowerCase();
      const { userExists, hasCredentialAccount } =
        await getPasswordCapabilityByEmail(normalizedEmail);

      if (userExists && !hasCredentialAccount) {
        return c.json(
          {
            eligible: false,
            message:
              "This account uses Google sign-in. Please set a password from My Account first.",
          },
          200
        );
      }

      // Keep non-existing users eligible to avoid account enumeration.
      return c.json({ eligible: true }, 200);
    }
  );

export { authRouter };
export type AuthRouterType = typeof authRouter;
