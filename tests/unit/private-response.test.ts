import { test } from "node:test";
import assert from "node:assert/strict";
import { privateJson } from "../../src/shared/lib/private-response";
import { authAttemptId } from "../../src/shared/lib/auth-attempt";
test("private API responses forbid browser and shared cache storage while preserving status and cookies", async () => {
  const r = privateJson(
    { message: "private" },
    {
      status: 409,
      headers: {
        "Cache-Control": "public",
        "Set-Cookie": "session=opaque; HttpOnly",
      },
    },
  );
  assert.equal(r.status, 409);
  assert.match(r.headers.get("cache-control")!, /private, no-store/);
  assert.equal(r.headers.get("set-cookie"), "session=opaque; HttpOnly");
  assert.deepEqual(await r.json(), { message: "private" });
});
test("auth attempt keys group a window, do not expose scope and sort chronologically", () => {
  const now = 1_800_000_000_000;
  const id = authAttemptId("secret-account", now);
  assert.equal(id, authAttemptId("secret-account", now + 1));
  assert.ok(id < authAttemptId("secret-account", now + 900_000));
  assert.equal(id.includes("secret-account"), false);
  assert.notEqual(id, authAttemptId("other-account", now));
});
