import { createHmac, timingSafeEqual } from "node:crypto";
export const ADMIN_COOKIE = "food-map-admin";
export function adminKey() { const key = process.env.ADMIN_ACCESS_KEY; return key && key.length >= 32 ? key : null; }
export function equalSecret(a: string, b: string) {
  const x=Buffer.from(a), y=Buffer.from(b); return x.length === y.length && timingSafeEqual(x,y);
}
export function signAdminSession(key: string, now = Date.now()) {
  const expires = String(now + 8 * 60 * 60_000);
  return `${expires}.${createHmac("sha256",key).update(expires).digest("hex")}`;
}
export function validAdminSession(token: string | undefined, key: string | null, now=Date.now()) {
  if (!key || !token || token.length > 100) return false;
  const [expires, signature, extra] = token.split(".");
  if (extra || !/^\d{13}$/.test(expires ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
  if (Number(expires) <= now || Number(expires) > now + 8*60*60_000) return false;
  return equalSecret(signature,createHmac("sha256",key).update(expires).digest("hex"));
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
