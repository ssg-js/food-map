import { sessionHeaders } from "./session";
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
export function createAccountApi(baseUrl = "", fetcher: typeof fetch = fetch) {
  async function request(path: string, body?: Record<string, string>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const r = await fetcher(baseUrl.replace(/\/+$/, "") + path, {
        method: body ? "POST" : "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          ...sessionHeaders(),
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(baseUrl ? { "x-food-map-client": "native" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result: unknown = await r.json().catch(() => null);
      if (!r.ok)
        throw new Error(
          object(result) && typeof result.message === "string"
            ? result.message
            : "계정 요청에 실패했어요. 잠시 후 다시 시도해주세요.",
        );
      if (!object(result)) throw new Error("계정 응답을 확인하지 못했어요.");
      return result;
    } catch (error) {
      if (controller.signal.aborted)
        throw new Error(
          "응답이 늦어지고 있어요. 연결을 확인하고 다시 시도해주세요.",
        );
      if (error instanceof TypeError)
        throw new Error("서버에 연결하지 못했어요. 네트워크를 확인해주세요.");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  async function username(body: Record<string, unknown>) {
    if (typeof body.username !== "string")
      throw new Error("계정 응답을 확인하지 못했어요.");
    return body.username;
  }
  async function changed(body: Record<string, unknown>) {
    if (body.ok !== true)
      throw new Error("계정 변경 결과를 확인하지 못했어요.");
    return { ok: true as const };
  }
  return {
    async status() {
      const result = await request("/api/account/security");
      if (typeof result.hasRecoveryKey !== "boolean")
        throw new Error("계정 응답을 확인하지 못했어요.");
      return {
        username: await username(result),
        hasRecoveryKey: result.hasRecoveryKey,
      };
    },
    async issueKey(currentPassword: string) {
      const result = await request("/api/account/security", {
        action: "issue-key",
        currentPassword,
      });
      if (
        typeof result.recoveryKey !== "string" ||
        !/^FM-[A-Fa-f0-9]{64}$/.test(result.recoveryKey)
      )
        throw new Error("복구 키 응답을 확인하지 못했어요.");
      return { recoveryKey: result.recoveryKey };
    },
    async changePassword(
      currentPassword: string,
      newPassword: string,
      confirmation: string,
    ) {
      return changed(
        await request("/api/account/security", {
          action: "change-password",
          currentPassword,
          newPassword,
          confirmation,
        }),
      );
    },
    async findUsername(recoveryKey: string) {
      return {
        username: await username(
          await request("/api/auth/recover", {
            action: "find-username",
            recoveryKey,
          }),
        ),
      };
    },
    async resetPassword(
      recoveryKey: string,
      newPassword: string,
      confirmation: string,
    ) {
      return changed(
        await request("/api/auth/recover", {
          action: "reset-password",
          recoveryKey,
          newPassword,
          confirmation,
        }),
      );
    },
  };
}
