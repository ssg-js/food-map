import { SearchBlockedError } from "./search-budget";
const HEADERS = { "Cache-Control": "no-store, max-age=0" };
export interface SearchDependencies {
  enabled: boolean;
  apiKey?: string;
  reserve: () => Promise<void>;
  fetcher: typeof fetch;
}
function reply(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...HEADERS, ...extra } });
}
export async function handlePlaceSearch(request: Request, deps: SearchDependencies) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 200) return reply({ message: "검색어를 2~200자로 입력해주세요." }, 400);
  if (!deps.enabled || !deps.apiKey) return reply({ code: "SEARCH_DISABLED", message: "검색 연결을 준비하고 있어요. 잠시 후 다시 시도해주세요." }, 503);
  try {
    await deps.reserve();
    const response = await deps.fetcher("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000), redirect: "error",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": deps.apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName.text,places.formattedAddress" },
      body: JSON.stringify({ textQuery: q, languageCode: "ko", pageSize: 10 }),
    });
    if (response.status === 429) return reply({ code: "SEARCH_PROVIDER_LIMIT", message: "지도 서비스의 검색 한도에 도달했어요. 잠시 후 다시 이용해주세요." }, 429, { "Retry-After": "60" });
    if (!response.ok) return reply({ message: "장소 검색에 실패했어요. 잠시 후 다시 시도해주세요." }, 502);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") throw new Error("Invalid response");
    const places = (data as { places?: unknown }).places ?? [];
    if (!Array.isArray(places)) throw new Error("Invalid response");
    const items = places.flatMap((value: unknown) => {
      if (!value || typeof value !== "object") return [];
      const p = value as { id?: unknown; displayName?: { text?: unknown }; formattedAddress?: unknown };
      return typeof p.id === "string" && typeof p.displayName?.text === "string" && typeof p.formattedAddress === "string"
        ? [{ placeId: p.id, name: p.displayName.text, address: p.formattedAddress }] : [];
    });
    return reply(items);
  } catch (error) {
    if (error instanceof SearchBlockedError) return reply({ code: error.code, message: error.message, resetAt: error.resetAt },
      error.code === "SEARCH_LIMIT_REACHED" ? 429 : 503,
      error.resetAt ? { "Retry-After": String(Math.max(1, Math.ceil((Date.parse(error.resetAt) - Date.now()) / 1000))) } : {});
    return reply({ message: "장소 검색에 실패했어요. 연결을 확인하고 다시 시도해주세요." }, 502);
  }
}
