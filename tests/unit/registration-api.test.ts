import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRegistrationApi,
  normalizeCategoryName,
} from "../../packages/registration/src/api";

test("search is submitted explicitly and short queries never reach the server", async () => {
  let requests = 0;
  const api = createRegistrationApi("", async () => {
    requests++;
    return Response.json([]);
  });
  await assert.rejects(api.search(" 가 "), /2자/);
  assert.equal(requests, 0);
});
test("native base URL, Unicode query and contract are preserved", async () => {
  let requested = "";
  const api = createRegistrationApi("http://10.0.2.2:3000/", async (input) => {
    requested = String(input);
    return Response.json([{ placeId: "a", name: "국수", address: "서울" }]);
  });
  const places = await api.search(" 성수 국수 ");
  assert.equal(new URL(requested).origin, "http://10.0.2.2:3000");
  assert.equal(new URL(requested).searchParams.get("q"), "성수 국수");
  assert.equal(places[0].placeId, "a");
});
test("invalid payloads are rejected rather than rendered", async () => {
  const api = createRegistrationApi("", async () =>
    Response.json([{ id: "wrong" }]),
  );
  await assert.rejects(api.search("국수"), /응답/);
  await assert.rejects(api.categories(), /응답/);
});
test("category normalization matches backend and save requires at least one category", async () => {
  const requests: { path: string; body: unknown }[] = [];
  const api = createRegistrationApi("", async (path, init) => {
    requests.push({ path: String(path), body: JSON.parse(String(init?.body)) });
    return String(path).includes("categories")
      ? Response.json({ id: "c", name: "혼자 먹기", kind: "PURPOSE" })
      : Response.json({ id: "r", googlePlaceId: "p", categories: [] });
  });
  assert.equal(normalizeCategoryName("  혼자   먹기  "), "혼자 먹기");
  await api.createCategory({ name: "  혼자   먹기  ", kind: "PURPOSE" });
  await assert.rejects(
    api.save({ googlePlaceId: "p", categoryIds: [] }),
    /하나 이상/,
  );
  await api.save({ googlePlaceId: "p", categoryIds: ["c"] });
  assert.deepEqual(requests[0].body, { name: "혼자 먹기", kind: "PURPOSE" });
  assert.deepEqual(requests[1].body, {
    googlePlaceId: "p",
    categoryIds: ["c"],
  });
});
test("category validation prevents unnecessary mutations", async () => {
  let requests = 0;
  const api = createRegistrationApi("", async () => {
    requests++;
    return Response.json({});
  });
  await assert.rejects(api.createCategory({ name: " ", kind: "FOOD" }), /1~20/);
  await assert.rejects(
    api.createCategory({ name: "가".repeat(21), kind: "FOOD" }),
    /1~20/,
  );
  assert.equal(requests, 0);
});
test("server errors preserve useful messages, non-JSON errors have a fallback", async () => {
  const disabled = createRegistrationApi("", async () =>
    Response.json(
      { message: "검색 기능이 비활성화되어 있습니다." },
      { status: 503 },
    ),
  );
  await assert.rejects(disabled.search("국수"), /비활성화/);
  const invalid = createRegistrationApi(
    "",
    async () => new Response("proxy error", { status: 502 }),
  );
  await assert.rejects(invalid.categories(), /다시 시도/);
});
test("requests use no-store and signal; sensitive data never needs local storage", async () => {
  let options: RequestInit | undefined;
  const api = createRegistrationApi("", async (_input, init) => {
    options = init;
    return Response.json({ items: [] });
  });
  await api.categories();
  assert.equal(options?.cache, "no-store");
  assert.ok(options?.signal instanceof AbortSignal);
});
