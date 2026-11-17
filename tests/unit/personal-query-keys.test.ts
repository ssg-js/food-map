import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { personalQueryKeys as keys } from "../../packages/registration/src/personal-query-keys";
const filters = {
  food: ["food"],
  purpose: [],
  dish: ["dish"],
  q: "돈카츠",
  page: 1,
};

test("identical filters and place ids keep account A and B cache contents separate", () => {
  const client = new QueryClient();
  try {
    client.setQueryData(keys.catalogList("account-a", filters), {
      items: ["a-only"],
    });
    client.setQueryData(keys.catalogList("account-b", { ...filters }), {
      items: ["b-only"],
    });
    client.setQueryData(keys.place("account-a", "same-google-place"), {
      name: "a-view",
    });
    client.setQueryData(keys.place("account-b", "same-google-place"), {
      name: "b-view",
    });
    assert.deepEqual(
      client.getQueryData(keys.catalogList("account-a", filters)),
      { items: ["a-only"] },
    );
    assert.deepEqual(
      client.getQueryData(keys.catalogList("account-b", filters)),
      { items: ["b-only"] },
    );
    assert.deepEqual(
      client.getQueryData(keys.place("account-a", "same-google-place")),
      { name: "a-view" },
    );
    assert.deepEqual(
      client.getQueryData(keys.place("account-b", "same-google-place")),
      { name: "b-view" },
    );
  } finally {
    client.clear();
  }
});
test("owner-scoped category writes and catalog invalidation do not modify another account", async () => {
  const client = new QueryClient();
  try {
    client.setQueryData(keys.categories("account-a"), ["a-category"]);
    client.setQueryData(keys.categories("account-b"), ["b-category"]);
    client.setQueryData(keys.catalogList("account-a", filters), ["a-place"]);
    client.setQueryData(keys.catalogList("account-b", filters), ["b-place"]);
    client.setQueryData<string[]>(keys.categories("account-a"), (previous) => [
      ...(previous ?? []),
      "a-created",
    ]);
    await client.invalidateQueries({
      queryKey: keys.catalog("account-a"),
      refetchType: "none",
    });
    assert.deepEqual(client.getQueryData(keys.categories("account-b")), [
      "b-category",
    ]);
    assert.equal(
      client.getQueryState(keys.catalogList("account-a", filters))
        ?.isInvalidated,
      true,
    );
    assert.equal(
      client.getQueryState(keys.catalogList("account-b", filters))
        ?.isInvalidated,
      false,
    );
  } finally {
    client.clear();
  }
});
test("a late response for the previous account cannot replace the next account's same-filter cache", async () => {
  const client = new QueryClient();
  let deliverA!: (items: string[]) => void;
  try {
    const pendingA = client.fetchQuery({
      queryKey: keys.catalogList("account-a", filters),
      queryFn: () =>
        new Promise<string[]>((resolve) => {
          deliverA = resolve;
        }),
    });
    await client.fetchQuery({
      queryKey: keys.catalogList("account-b", filters),
      queryFn: async () => ["b-private"],
    });
    deliverA(["a-private"]);
    await pendingA;
    assert.deepEqual(
      client.getQueryData(keys.catalogList("account-b", filters)),
      ["b-private"],
    );
    assert.deepEqual(
      client.getQueryData(keys.catalogList("account-a", filters)),
      ["a-private"],
    );
  } finally {
    client.clear();
  }
});
test("anonymous owner ids cannot create a private cache namespace", () => {
  assert.throws(() => keys.categories(""), /계정 식별자/);
  assert.throws(() => keys.place(" ", "place"), /계정 식별자/);
});
