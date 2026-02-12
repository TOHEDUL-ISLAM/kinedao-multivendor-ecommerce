import { env } from "@kineDao.com/env/web";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        roles: {
          type: "string[]",
          input: false,
          required: false,
        },
      },
    }),
  ],
});
