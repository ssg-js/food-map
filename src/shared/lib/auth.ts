import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username, bearer } from "better-auth/plugins";
import { prisma } from "./prisma";
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.AUTH_BASE_URL || "http://localhost:3000",
  trustedOrigins: (
    process.env.AUTH_TRUSTED_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000"
  ).split(","),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: false,
  },
  session: { expiresIn: 60 * 60 * 8, cookieCache: { enabled: false } },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "PENDING", input: false },
    },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 32 }),
    bearer(),
  ],
});
export type PersonalUser = {
  id: string;
  name: string;
  username: string | null;
  role: string;
};
export async function currentUser(
  headers: Headers,
): Promise<PersonalUser | null> {
  if (!process.env.BETTER_AUTH_SECRET) return null;
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session || !["USER", "OPERATOR"].includes(session.user.role))
    return null;
  return {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username ?? null,
    role: session.user.role,
  };
}
