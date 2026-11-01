import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { getApiOrigin } from "./api-origin";

export const authClient = createAuthClient({
  baseURL: getApiOrigin(),
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
