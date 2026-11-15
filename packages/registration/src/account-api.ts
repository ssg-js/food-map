import { sessionHeaders } from "./session";
export function createAccountApi(baseUrl = "") {
  async function request(path: string, body?: Record<string, string>) {
    const r = await fetch(baseUrl.replace(/\/+$/, "") + path, {
      method: body ? "POST" : "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        ...sessionHeaders(),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(baseUrl ? { "x-food-map-client": "native" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.message || "계정 요청에 실패했어요.");
    return result;
  }
  return {
    status: () => request("/api/account/security"),
    issueKey: (currentPassword: string) =>
      request("/api/account/security", {
        action: "issue-key",
        currentPassword,
      }),
    changePassword: (
      currentPassword: string,
      newPassword: string,
      confirmation: string,
    ) =>
      request("/api/account/security", {
        action: "change-password",
        currentPassword,
        newPassword,
        confirmation,
      }),
    findUsername: (recoveryKey: string) =>
      request("/api/auth/recover", { action: "find-username", recoveryKey }),
    resetPassword: (
      recoveryKey: string,
      newPassword: string,
      confirmation: string,
    ) =>
      request("/api/auth/recover", {
        action: "reset-password",
        recoveryKey,
        newPassword,
        confirmation,
      }),
  };
}
