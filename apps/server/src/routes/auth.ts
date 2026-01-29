import { Hono } from "hono";
import { z } from "zod";
import { auth } from "@kineDao.com/auth";
import { env } from "@kineDao.com/env/server";

const authRouter = new Hono();

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

  return new Request(new URL(path, env.BETTER_AUTH_URL), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  callbackURL: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

authRouter.post("/sign-up", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = signUpSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ message: "Invalid sign up payload" }, 400);
  }

  const callbackURL = resolveFrontendUrl(parsed.data.callbackURL, "/login");

  const request = buildAuthRequest(
    "/api/auth/sign-up/email",
    {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL,
      rememberMe: parsed.data.rememberMe,
    },
    c.req.raw
  );

  return auth.handler(request);
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional(),
});

authRouter.post("/forgot-password", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ message: "Invalid forgot password payload" }, 400);
  }

  const redirectTo = resolveFrontendUrl(parsed.data.redirectTo, "/reset-password");

  const request = buildAuthRequest(
    "/api/auth/request-password-reset",
    {
      email: parsed.data.email,
      redirectTo,
    },
    c.req.raw
  );

  return auth.handler(request);
});

export { authRouter };
