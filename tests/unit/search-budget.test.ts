import { test } from "node:test";
import assert from "node:assert/strict";
import { handlePlaceSearch } from "../../src/shared/lib/google-places/search-handler";
import {
  SearchBlockedError,
  reserveSearchRequest,
} from "../../src/shared/lib/google-places/search-budget";
import {
  createRegistrationApi,
  RegistrationApiError,
  isSearchBlocked,
} from "../../packages/registration/src/api";
import type { PrismaClient } from "@prisma/client";
const request = () => new Request("http://localhost/api/places/search?q=성수");
for (const code of [
  "SEARCH_LIMIT_REACHED",
  "SEARCH_BUDGET_UNCONFIGURED",
  "SEARCH_BUDGET_UNAVAILABLE",
] as const) {
  test(`${code}: no Google request, typed error and no-store`, async () => {
    let calls = 0;
    const response = await handlePlaceSearch(request(), {
      enabled: true,
      apiKey: "test",
      reserve: async () => {
        throw new SearchBlockedError(code, "차단됨");
      },
      fetcher: async () => {
        calls++;
        return Response.json({});
      },
    });
    assert.equal(calls, 0);
    assert.equal(response.status, code === "SEARCH_LIMIT_REACHED" ? 429 : 503);
    assert.match(response.headers.get("cache-control")!, /no-store/);
    assert.equal((await response.json()).code, code);
  });
}
test("reservation is awaited before a single Google request; fieldmask cannot become Enterprise", async () => {
  const events: string[] = [];
  const response = await handlePlaceSearch(request(), {
    enabled: true,
    apiKey: "test",
    reserve: async () => {
      events.push("reserved");
    },
    fetcher: async (_url, init) => {
      events.push("fetch");
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.redirect, "error");
      assert.equal(
        new Headers(init?.headers).get("X-Goog-FieldMask"),
        "places.id,places.displayName.text,places.formattedAddress,places.location,places.attributions",
      );
      return Response.json({
        places: [
          {
            id: "p",
            displayName: { text: "식당" },
            formattedAddress: "서울",
            rating: 5,
          },
        ],
      });
    },
  });
  assert.deepEqual(events, ["reserved", "fetch"]);
  assert.deepEqual(await response.json(), [
    { placeId: "p", name: "식당", address: "서울", attributions: [] },
  ]);
});
test("provider 429 and timeout do not retry or refund reservation", async () => {
  for (const fail of [false, true]) {
    let calls = 0,
      reservations = 0;
    const response = await handlePlaceSearch(request(), {
      enabled: true,
      apiKey: "test",
      reserve: async () => {
        reservations++;
      },
      fetcher: async () => {
        calls++;
        if (fail) throw new Error("timeout");
        return Response.json({}, { status: 429 });
      },
    });
    assert.equal(calls, 1);
    assert.equal(reservations, 1);
    assert.equal(response.status, fail ? 502 : 429);
  }
});
test("short/oversized queries and disabled API consume no budget", async () => {
  for (const q of ["a", "a".repeat(201)]) {
    const response = await handlePlaceSearch(
      new Request(`http://localhost/?q=${q}`),
      {
        enabled: true,
        apiKey: "test",
        reserve: async () => {
          assert.fail("reserved");
        },
        fetcher: fetch,
      },
    );
    assert.equal(response.status, 400);
  }
  assert.equal(
    (
      await handlePlaceSearch(request(), {
        enabled: false,
        apiKey: "test",
        reserve: async () => {
          assert.fail("reserved");
        },
        fetcher: fetch,
      })
    ).status,
    503,
  );
});
test("database errors fail closed", async () => {
  const db = {
    $transaction: async () => {
      throw new Error("db unavailable");
    },
  } as unknown as PrismaClient;
  await assert.rejects(
    reserveSearchRequest(db),
    (error: unknown) =>
      error instanceof SearchBlockedError &&
      error.code === "SEARCH_BUDGET_UNAVAILABLE",
  );
});
test("clients preserve machine-readable limit code and reset time", async () => {
  const api = createRegistrationApi("", async () =>
    Response.json(
      {
        code: "SEARCH_LIMIT_REACHED",
        message: "한도",
        resetAt: "2026-12-01T08:00:00.000Z",
      },
      { status: 429 },
    ),
  );
  await assert.rejects(
    api.search("성수"),
    (e: unknown) =>
      e instanceof RegistrationApiError &&
      isSearchBlocked(e) &&
      e.status === 429 &&
      !!e.resetAt,
  );
});
