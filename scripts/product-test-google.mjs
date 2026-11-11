// Test-process-only Google responses. Never imported by application source.
if (process.env.FOOD_MAP_PRODUCT_TEST !== "true")
  throw new Error("Product test preload must not run outside test server");
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
  );
  if (url.hostname !== "places.googleapis.com") return original(input, init);
  const names = {
    "fixture-alpha": "소담 파스타",
    "fixture-beta": "성수 국수",
    "fixture-gamma": "정담 식당",
  };
  const make = (id) => ({
    id,
    displayName: { text: names[id] ?? "테스트 식당" },
    formattedAddress: "서울 성동구 테스트길 12",
    location: { latitude: 37.5445, longitude: 127.0557 },
    attributions: [],
  });
  if (url.pathname.endsWith(":searchText"))
    return Response.json({
      places: [make("fixture-alpha"), make("fixture-beta")],
    });
  return Response.json(make(decodeURIComponent(url.pathname.split("/").pop())));
};
