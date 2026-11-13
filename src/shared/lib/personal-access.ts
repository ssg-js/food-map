import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "./auth";
import { sameOrigin } from "./admin-auth";
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};
export async function access(request: Request) {
  const user = await currentUser(request.headers);
  if (!user)
    return {
      denied: Response.json(
        { code: "LOGIN_REQUIRED", message: "로그인이 필요해요." },
        { status: 401, headers: privateHeaders },
      ),
    };
  if (
    !["GET", "HEAD"].includes(request.method) &&
    !request.headers.get("authorization")?.startsWith("Bearer ") &&
    !sameOrigin(request)
  )
    return {
      denied: Response.json(
        { message: "허용되지 않은 요청이에요." },
        { status: 403, headers: privateHeaders },
      ),
    };
  return { user };
}
export async function requirePageUser() {
  const user = await currentUser(await headers());
  if (!user) redirect("/login");
  return user;
}
