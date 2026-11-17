import { privateJson } from "./private-response";
export const MAX_JSON_BODY_BYTES = 64 * 1024;
const BODY_TIMEOUT_MS = 10_000;
class JsonBodyError extends Error {
  constructor(public status: 400 | 408 | 413) {
    super("Invalid request body");
  }
}
type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };
/** Bound actual streamed bytes; a missing or dishonest Content-Length never bypasses the cap. */
export async function readJsonRequest(
  request: Request,
  options: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<JsonBodyResult> {
  const maxBytes = options.maxBytes ?? MAX_JSON_BODY_BYTES;
  const timeoutMs = options.timeoutMs ?? BODY_TIMEOUT_MS;
  try {
    const length = request.headers.get("content-length");
    if (length && /^\d+$/.test(length) && Number(length) > maxBytes) {
      void request.body?.cancel().catch(() => {});
      throw new JsonBodyError(413);
    }
    if (!request.body) throw new JsonBodyError(400);
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0,
      text = "",
      finished = false,
      timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // cancel closes pending reads immediately, without waiting for the transport's cancellation promise.
      void reader.cancel().catch(() => {});
    }, timeoutMs);
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (timedOut) throw new JsonBodyError(408);
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) throw new JsonBodyError(413);
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      finished = true;
      return { ok: true, value: JSON.parse(text) as unknown };
    } finally {
      clearTimeout(timer);
      if (!finished) void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } catch (error) {
    const status = error instanceof JsonBodyError ? error.status : 400;
    return {
      ok: false,
      response: privateJson(
        {
          code:
            status === 413
              ? "REQUEST_TOO_LARGE"
              : status === 408
                ? "REQUEST_TIMEOUT"
                : "INVALID_JSON",
          message:
            status === 413
              ? "입력 내용이 너무 커요. 내용을 줄여 다시 시도해주세요."
              : status === 408
                ? "요청 시간이 초과됐어요. 다시 시도해주세요."
                : "입력 내용을 확인해주세요.",
        },
        { status },
      ),
    };
  }
}
