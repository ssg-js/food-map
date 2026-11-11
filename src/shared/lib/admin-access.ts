import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminKey, validAdminSession } from "./admin-auth";
export async function isAdmin() { return validAdminSession((await cookies()).get(ADMIN_COOKIE)?.value, adminKey()); }
export const privateHeaders = { "Cache-Control": "private, no-store, max-age=0" };
