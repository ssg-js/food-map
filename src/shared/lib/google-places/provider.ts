import {
  mockPlaces,
  asGooglePlace,
  inViewport,
  validViewport,
} from "@food-map/registration";
export type ExternalMode = "mock" | "live";
export function externalMode(): ExternalMode {
  return process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock";
}
export const mockGoogleFetch: typeof fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
  );
  if (url.hostname !== "places.googleapis.com")
    throw new Error("Mock provider forbids external network");
  if (url.pathname.endsWith(":searchText")) {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const q = String(body.textQuery ?? "")
      .trim()
      .toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const rectangle = body.locationRestriction?.rectangle;
    const viewport = {
      south: rectangle?.low?.latitude,
      west: rectangle?.low?.longitude,
      north: rectangle?.high?.latitude,
      east: rectangle?.high?.longitude,
    };
    if (!validViewport(viewport))
      return Response.json(
        { error: { status: "INVALID_ARGUMENT" } },
        { status: 400 },
      );
    const places = mockPlaces.filter(
      (p) =>
        inViewport(p.location, viewport) &&
        terms.every((t) =>
          (
            "맛집 음식점 식당" +
            p.name +
            p.address +
            (p.name.includes("돈카츠")
              ? "일식"
              : p.name.includes("파스타")
                ? "양식"
                : "한식")
          )
            .toLowerCase()
            .includes(t),
        ),
    );
    return Response.json({ places: places.map(asGooglePlace) });
  }
  const id = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const place = mockPlaces.find((p) => p.placeId === id);
  return place
    ? Response.json(asGooglePlace(place))
    : Response.json({ error: { status: "NOT_FOUND" } }, { status: 404 });
};
export function placesFetch(): typeof fetch {
  return externalMode() === "mock" ? mockGoogleFetch : fetch;
}
