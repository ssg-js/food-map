import { externalMode, placesFetch } from "@/shared/lib/google-places/provider";
import { access } from "@/shared/lib/personal-access";
import { reservePersonalRequest } from "@/shared/lib/google-places/personal-budget";
import { SearchBlockedError } from "@/shared/lib/google-places/search-budget";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const a = await access(_request);
  if (a.denied) return a.denied;
  const { id } = await params;
  const headers = { "Cache-Control": "no-store" };
  if (!id.trim() || id.length > 512)
    return Response.json(
      { message: "장소 ID를 확인해주세요." },
      { status: 400, headers },
    );
  if (
    externalMode() === "live" &&
    (process.env.GOOGLE_PLACES_ENABLED !== "true" ||
      !process.env.GOOGLE_PLACES_API_KEY)
  )
    return Response.json(
      { message: "장소 정보 조회를 준비 중이에요." },
      { status: 503, headers },
    );
  try {
    await reservePersonalRequest(a.user.id, "DETAILS");
    const url = new URL(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    );
    url.searchParams.set("languageCode", "ko");
    const response = await placesFetch()(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([AbortSignal.timeout(10000), _request.signal]),
      headers: {
        "X-Goog-Api-Key":
          externalMode() === "mock"
            ? "mock"
            : process.env.GOOGLE_PLACES_API_KEY!,
        "X-Goog-FieldMask":
          "id,displayName.text,formattedAddress,location,attributions",
      },
    });
    if (response.status === 404)
      return Response.json(
        { message: "장소 정보가 변경되었거나 더 이상 제공되지 않아요." },
        { status: 404, headers },
      );
    if (!response.ok)
      return Response.json(
        { message: "장소 정보를 가져오지 못했어요." },
        { status: response.status === 429 ? 429 : 502, headers },
      );
    const p = await response.json();
    if (
      typeof p.id !== "string" ||
      typeof p.displayName?.text !== "string" ||
      typeof p.formattedAddress !== "string"
    )
      throw new Error("invalid place");
    return Response.json(
      {
        placeId: p.id,
        name: p.displayName.text,
        address: p.formattedAddress,
        location: p.location,
        attributions: p.attributions ?? [],
      },
      { headers },
    );
  } catch (e) {
    return Response.json(
      {
        message:
          e instanceof SearchBlockedError
            ? e.message
            : "장소 정보를 가져오지 못했어요.",
        code: e instanceof SearchBlockedError ? e.code : undefined,
      },
      {
        status:
          e instanceof SearchBlockedError
            ? e.code === "SEARCH_LIMIT_REACHED"
              ? 429
              : 503
            : 502,
        headers,
      },
    );
  }
}
