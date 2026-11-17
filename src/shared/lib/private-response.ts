/** Personal API responses must never be stored by shared proxies or browser caches. */
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};
export function privateJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(privateHeaders))
    headers.set(name, value);
  return Response.json(data, { ...init, headers });
}
