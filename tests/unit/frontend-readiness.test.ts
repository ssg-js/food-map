import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveApiOrigin } from "../../apps/mobile/src/shared/api-origin";
import { createAccountApi } from "../../packages/registration/src/account-api";
import { notifySessionChanged } from "../../src/features/auth/model/session-change";

test("release API origin rejects missing and public HTTP endpoints while preserving local development", () => {
  assert.throws(
    () => resolveApiOrigin(undefined, "ios", false),
    /EXPO_PUBLIC_API_URL/,
  );
  assert.throws(
    () => resolveApiOrigin("http://api.example.com", "android", false),
    /HTTPS/,
  );
  assert.throws(
    () => resolveApiOrigin("https://user:secret@api.example.com", "ios", false),
    /origin/,
  );
  assert.throws(
    () =>
      resolveApiOrigin("https://api.example.com/other?token=x", "ios", false),
    /origin/,
  );
  assert.throws(
    () => resolveApiOrigin("http://192.168.1.3:3000", "ios", false),
    /HTTPS/,
  );
  for (const endpoint of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.0.2.2:3000",
  ]) {
    assert.throws(() => resolveApiOrigin(endpoint, "ios", false), /HTTPS/);
  }
  assert.throws(
    () => resolveApiOrigin("http://127.0.0.1:3200", "ios", false, true),
    /HTTPS/,
  );
  assert.throws(
    () => resolveApiOrigin("http://10.0.2.2:3200", "web", false, true),
    /HTTPS/,
  );
  assert.equal(
    resolveApiOrigin("https://api.example.com/", "ios", false),
    "https://api.example.com",
  );
  assert.equal(
    resolveApiOrigin(undefined, "android", true),
    "http://10.0.2.2:3000",
  );
  assert.equal(
    resolveApiOrigin("http://192.168.1.3:3000", "ios", true),
    "http://192.168.1.3:3000",
  );
  assert.equal(
    resolveApiOrigin("http://127.0.0.1:3200", "web", false, true),
    "http://127.0.0.1:3200",
  );
});
test("logout notification cannot fail when browser storage is blocked", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });
  try {
    assert.doesNotThrow(notifySessionChanged);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
test("account requests handle proxy HTML errors, enforce no-store and reject malformed successful payloads", async () => {
  const api = createAccountApi("", async (_url, init) => {
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal);
    return new Response("<html>Bad Gateway</html>", { status: 502 });
  });
  await assert.rejects(api.status(), /계정 요청에 실패/);
  const malformed = createAccountApi("", async () =>
    Response.json({ hasRecoveryKey: "yes" }),
  );
  await assert.rejects(malformed.status(), /계정 응답/);
  const badKey = createAccountApi("", async () =>
    Response.json({ recoveryKey: "unexpected" }),
  );
  await assert.rejects(badKey.issueKey("password"), /복구 키 응답/);
});
test("account requests time out instead of leaving a permanent pending form", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const api = createAccountApi(
    "",
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  );
  const result = assert.rejects(api.status(), /응답이 늦어지고/);
  t.mock.timers.tick(20_000);
  await result;
});
