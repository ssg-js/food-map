/** Release apps must never silently send credentials to a development server. */
export function resolveApiOrigin(
  configured: string | undefined,
  platform: string,
  development: boolean,
  localQa = false,
): string {
  const value = configured?.trim();
  if (!value) {
    if (!development)
      throw new Error(
        "배포 앱의 EXPO_PUBLIC_API_URL을 HTTPS 서버 주소로 설정해주세요.",
      );
    return platform === "android"
      ? "http://10.0.2.2:3000"
      : "http://127.0.0.1:3000";
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL은 올바른 서버 주소여야 해요.");
  }
  const host = url.hostname;
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  const privateHost =
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    host.endsWith(".local");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ((development && (loopback || privateHost)) ||
        (localQa && platform === "web" && loopback))
    )
  )
    throw new Error(
      "외부 API 서버는 HTTPS 주소를 사용해야 해요. HTTP는 로컬 개발에서만 허용돼요.",
    );
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "EXPO_PUBLIC_API_URL에는 서버 origin만 입력해주세요. 인증정보·경로·쿼리는 포함할 수 없어요.",
    );
  return url.origin;
}
