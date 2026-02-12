import { createMiddleware } from "@tanstack/react-start";

import { authClient } from "@/lib/auth-client";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  let session: Awaited<ReturnType<typeof authClient.getSession>>["data"] | null = null;

  try {
    const result = await authClient.getSession({
      fetchOptions: {
        headers: request.headers,
        throw: false,
      },
    });
    session = result?.data ?? null;
  } catch (error) {
    console.error("[WebAuthMiddleware] getSession failed:", error);
    session = null;
  }

  return next({
    context: { session },
  });
});
