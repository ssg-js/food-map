import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validViewport,
  inViewport,
  viewportFromCenter,
  viewportKey,
  readMapEvent,
  readMapState,
} from "../../packages/registration/src/index";
import { handlePlaceSearch } from "../../src/shared/lib/google-places/search-handler";
const area = { south: 37.54, west: 127.04, north: 37.55, east: 127.06 };
test("invalid, empty and inverted latitude bounds are rejected; dateline is supported", () => {
  for (const v of [
    null,
    {},
    { ...area, south: NaN },
    { ...area, north: 37 },
    { ...area, east: 181 },
    { ...area, east: area.west },
  ])
    assert.equal(validViewport(v), false);
  const wrapped = { south: -10, north: 10, west: 170, east: -170 };
  assert.equal(validViewport(wrapped), true);
  assert.equal(inViewport({ latitude: 0, longitude: 179 }, wrapped), true);
  assert.equal(inViewport({ latitude: 0, longitude: -179 }, wrapped), true);
  assert.equal(inViewport({ latitude: 0, longitude: 0 }, wrapped), false);
  assert.equal(
    inViewport({ latitude: area.south, longitude: area.west }, area),
    true,
  );
  assert.equal(inViewport({ latitude: 37.56, longitude: 127.05 }, area), false);
  assert.equal(
    inViewport({ latitude: 37.545, longitude: Infinity }, area),
    false,
  );
});
test("missing or invalid viewport never reserves quota or calls Google", async () => {
  for (const bounds of [
    undefined,
    "oops",
    JSON.stringify({ ...area, north: 0 }),
  ]) {
    let reserved = 0,
      calls = 0;
    const q = new URLSearchParams({
      q: "돈카츠",
      ...(bounds ? { bounds } : {}),
    });
    const r = await handlePlaceSearch(
      new Request(`http://localhost/api/places/search?${q}`),
      {
        enabled: true,
        apiKey: "test",
        reserve: async () => {
          reserved++;
        },
        fetcher: async () => {
          calls++;
          return Response.json({});
        },
      },
    );
    assert.equal(r.status, 400);
    assert.equal(reserved, 0);
    assert.equal(calls, 0);
  }
});
test("Google rectangle uses viewport and returned places are filtered by coordinates", async () => {
  const q = new URLSearchParams({
    q: "성수 돈카츠",
    bounds: JSON.stringify(area),
  });
  const response = await handlePlaceSearch(
    new Request(`http://localhost/api/places/search?${q}`),
    {
      enabled: true,
      apiKey: "test",
      reserve: async () => {},
      fetcher: async (_, init) => {
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(body.locationRestriction, {
          rectangle: {
            low: { latitude: area.south, longitude: area.west },
            high: { latitude: area.north, longitude: area.east },
          },
        });
        assert.equal(body.includedType, "restaurant");
        const item = {
          displayName: { text: "fixture" },
          formattedAddress: "서울",
        };
        return Response.json({
          places: [
            {
              ...item,
              id: "inside",
              location: { latitude: 37.545, longitude: 127.05 },
            },
            {
              ...item,
              id: "outside",
              location: { latitude: 37.5, longitude: 127.05 },
            },
            { ...item, id: "no-coordinate" },
          ],
        });
      },
    },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    (await response.json()).map((p: { placeId: string }) => p.placeId),
    ["inside"],
  );
});
test("mock viewport changes with zoom and ignores tiny bounds jitter", () => {
  const center = { latitude: 37.545, longitude: 127.05 },
    wide = viewportFromCenter(center, 14, 800, 400),
    close = viewportFromCenter(center, 15, 800, 400);
  assert.equal(validViewport(wide), true);
  assert.ok(close.north - close.south < wide.north - wide.south);
  assert.equal(
    viewportKey(area),
    viewportKey({ ...area, north: area.north + 1e-8 }),
  );
});
test("native bridge rejects invalid geometry and oversized point payloads", () => {
  assert.equal(
    readMapEvent({ type: "viewport", bounds: { ...area, north: NaN } }),
    null,
  );
  assert.equal(
    readMapState({
      type: "map-state",
      center: { latitude: Infinity, longitude: 0 },
      title: "test",
      points: [],
      activeId: null,
    }),
    null,
  );
  assert.deepEqual(readMapEvent({ type: "viewport", bounds: area }), {
    type: "viewport",
    bounds: area,
  });
});

test("native bridge carries real user location separately and rejects invalid GPS", () => {
  const state = {
    type: "map-state",
    center: { latitude: 37, longitude: 127 },
    title: "지도",
    points: [],
    activeId: null,
  };
  const userLocation = { latitude: 37.5455, longitude: 127.0543 };
  assert.deepEqual(
    readMapState({ ...state, userLocation })?.userLocation,
    userLocation,
  );
  for (const userLocation of [
    null,
    { latitude: NaN, longitude: 0 },
    { latitude: 91, longitude: 0 },
  ])
    assert.equal(readMapState({ ...state, userLocation }), null);
});
