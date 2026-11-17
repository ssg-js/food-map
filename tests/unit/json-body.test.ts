import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_JSON_BODY_BYTES,
  readJsonRequest,
} from "../../src/shared/lib/json-body";
function streamed(chunks: Uint8Array[], contentLength?: string) {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    body: stream,
    duplex: "half",
    headers: contentLength ? { "Content-Length": contentLength } : {},
  };
  return {
    request: new Request("http://localhost/api/auth/login", init),
    cancelled: () => cancelled,
  };
}
const utf8 = (s: string) => new TextEncoder().encode(s);
test("JSON reader accepts a valid body at the exact byte limit, including split UTF-8", async () => {
  const raw = utf8(JSON.stringify({ name: "한식" }));
  const { request } = streamed([raw.slice(0, 10), raw.slice(10)]);
  const r = await readJsonRequest(request, { maxBytes: raw.length });
  assert.deepEqual(r, { ok: true, value: { name: "한식" } });
});
test("chunked and falsely undersized bodies cannot bypass the actual byte cap", async () => {
  for (const length of [undefined, "1"]) {
    const raw = utf8(
      JSON.stringify({ name: "한".repeat(MAX_JSON_BODY_BYTES / 3) }),
    );
    const { request } = streamed([raw.slice(0, 100), raw.slice(100)], length);
    const r = await readJsonRequest(request);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.response.status, 413);
      assert.match(
        r.response.headers.get("cache-control")!,
        /private, no-store/,
      );
    }
  }
});
test("declared oversized bodies are rejected and cancelled without being read", async () => {
  let cancelled = false;
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    duplex: "half",
    headers: { "Content-Length": String(MAX_JSON_BODY_BYTES + 1) },
    body: new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  };
  const r = await readJsonRequest(new Request("http://localhost", init));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.response.status, 413);
  assert.equal(cancelled, true);
});
test("empty, malformed JSON and invalid UTF-8 return safe 400 responses", async () => {
  for (const chunks of [
    [utf8("")],
    [utf8("{broken")],
    [new Uint8Array([0xff])],
  ]) {
    const r = await readJsonRequest(streamed(chunks).request);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.response.status, 400);
      assert.equal((await r.response.json()).code, "INVALID_JSON");
    }
  }
});
test("a stalled client body is cancelled after the total read deadline", async () => {
  let cancelled = false;
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    duplex: "half",
    body: new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  };
  const r = await readJsonRequest(new Request("http://localhost", init), {
    timeoutMs: 5,
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.response.status, 408);
  assert.equal(cancelled, true);
});
