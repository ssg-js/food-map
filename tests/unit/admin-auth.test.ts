import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sameOrigin,
  signAdminSession,
  validAdminSession,
} from "../../src/shared/lib/admin-auth";
test("browser host comparison supports Next internal hostname and rejects cross-site origin", () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3300/", {
        headers: { host: "127.0.0.1:3300", origin: "http://127.0.0.1:3300" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("http://localhost/", {
        headers: {
          host: "localhost",
          origin: "https://evil.example",
          "x-forwarded-host": "evil.example",
        },
      }),
    ),
    false,
  );
  assert.equal(sameOrigin(new Request("http://localhost/")), false);
});
test("operator session expires, rejects tampering and cannot survive key rotation", () => {
  const now = Date.now(),
    key = "unit-test-key-with-at-least-32-characters",
    session = signAdminSession(key, now);
  assert.equal(validAdminSession(session, key, now), true);
  assert.equal(validAdminSession(session, key, now + 8 * 60 * 60_000), false);
  assert.equal(validAdminSession(session + "x", key, now), false);
  assert.equal(validAdminSession(session, key + "rotated", now), false);
});
