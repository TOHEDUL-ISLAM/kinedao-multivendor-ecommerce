import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "@kineDao.com/auth";
import { env } from "@kineDao.com/env/server";
import { signUpSchema, forgotPasswordSchema } from "@kineDao.com/api-types/auth";

const frontendBaseUrl = env.FRONTEND_URL.replace(/\/+$/, "");
const frontendOrigin = new URL(frontendBaseUrl).origin;

const resolveFrontendUrl = (value: string | undefined, fallbackPath: string) => {
  const fallback = new URL(fallbackPath, frontendBaseUrl).toString();
  if (!value) return fallback;
  try {
    const parsed = new URL(value, frontendBaseUrl);
    return parsed.origin === frontendOrigin ? parsed.toString() : fallback;
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

// POST /api/auth/sign-up - Custom sign-up handler
// POST /api/auth/forgot-password - Custom forgot password handler
const authRouter = new Hono()
  .post("/sign-up", zValidator("json", signUpSchema), async (c) => {
    const data = c.req.valid("json");
    const callbackURL = resolveFrontendUrl(data.callbackURL, "/login");

    const request = buildAuthRequest(
      "/api/auth/sign-up/email",
      {
        name: data.name,
        email: data.email,
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
    const redirectTo = resolveFrontendUrl(data.redirectTo, "/reset-password");

    const request = buildAuthRequest(
      "/api/auth/request-password-reset",
      {
        email: data.email,
        redirectTo,
      },
      c.req.raw
    );

    return auth.handler(request);
  });

export { authRouter };
export type AuthRouterType = typeof authRouter;
