import { expo } from "@better-auth/expo";
import { createDb } from "@luke/db";
import * as schema from "@luke/db/schema/auth";
import { env } from "@luke/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, "luke://", "exp://", "http://localhost:8081"],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies(), expo()],
  });
}

export const auth = createAuth();
