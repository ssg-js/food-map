export type DeploymentIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
};
export type DeploymentEnvironment = Record<string, string | undefined>;

/** Pure, offline checks. Never include environment values in diagnostics. */
export function inspectDeployment(
  env: DeploymentEnvironment,
  production: boolean,
): DeploymentIssue[] {
  const issues: DeploymentIssue[] = [];
  const fail = (id: string, message: string) =>
    issues.push({ id, message, severity: production ? "error" : "warning" });
  const warn = (id: string, message: string) =>
    issues.push({ id, message, severity: "warning" });
  const localHost = (host: string) =>
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "[::1]" ||
    host === "0.0.0.0" ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  const origin = (raw: string | undefined): URL | null => {
    try {
      const url = new URL(raw ?? "");
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        !["http:", "https:"].includes(url.protocol)
      )
        return null;
      return url;
    } catch {
      return null;
    }
  };
  const strongSecret = (value: string | undefined) =>
    !!value &&
    value.length >= 32 &&
    new Set(value).size >= 8 &&
    !/example|change.?me|placeholder|test.?secret|your.?secret/i.test(value);

  if (
    production &&
    env.DEPLOYMENT_ENV !== "production" &&
    env.VERCEL_ENV !== "production"
  )
    fail(
      "RUNTIME_GUARD",
      "DEPLOYMENT_ENV=production으로 서버 시작 시 검증도 활성화하세요.",
    );
  if (!strongSecret(env.BETTER_AUTH_SECRET))
    fail(
      "AUTH_SECRET",
      "BETTER_AUTH_SECRET은 개발용과 다른 충분히 긴 무작위 비밀값이어야 합니다.",
    );
  if (env.PERSONAL_SETUP_TOKEN && !strongSecret(env.PERSONAL_SETUP_TOKEN))
    fail(
      "SETUP_SECRET",
      "PERSONAL_SETUP_TOKEN을 사용할 때는 긴 무작위 값이 필요합니다.",
    );
  if (!env.PERSONAL_SETUP_TOKEN)
    warn(
      "SETUP_DISABLED",
      "초기 계정 생성 토큰이 없습니다. 계정 생성이 완료됐는지 확인하세요.",
    );
  if (
    env.PERSONAL_SETUP_TOKEN &&
    env.PERSONAL_SETUP_TOKEN === env.BETTER_AUTH_SECRET
  )
    fail("SEPARATE_SECRETS", "초기 설정 토큰과 인증 비밀값을 분리하세요.");

  const base = origin(env.AUTH_BASE_URL);
  if (
    !base ||
    (production && (base.protocol !== "https:" || localHost(base.hostname)))
  )
    fail(
      "AUTH_ORIGIN",
      "AUTH_BASE_URL을 운영 HTTPS origin으로 명시하세요(경로·자격증명·query 제외).",
    );
  const origins = (env.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (
    !origins.length ||
    origins.some((value) => {
      const url = origin(value);
      return (
        !url ||
        (production && (url.protocol !== "https:" || localHost(url.hostname)))
      );
    }) ||
    (base && !origins.some((value) => origin(value)?.origin === base.origin))
  )
    fail(
      "TRUSTED_ORIGINS",
      "AUTH_TRUSTED_ORIGINS에는 운영 origin을 포함한 명시적 HTTPS origin만 허용하세요.",
    );

  try {
    const db = new URL(env.DATABASE_URL ?? "");
    if (
      !["postgres:", "postgresql:", "prisma+postgres:"].includes(db.protocol) ||
      (production && localHost(db.hostname))
    )
      fail(
        "DATABASE_TARGET",
        "운영 DATABASE_URL은 로컬 개발 DB와 분리된 PostgreSQL이어야 합니다.",
      );
    if (
      production &&
      ["postgres:", "postgresql:"].includes(db.protocol) &&
      !["require", "verify-ca", "verify-full"].includes(
        db.searchParams.get("sslmode") ?? "",
      )
    )
      fail(
        "DATABASE_TLS",
        "운영 PostgreSQL 연결에 공급자가 지원하는 TLS sslmode를 명시하세요.",
      );
    if (
      production &&
      (db.searchParams.get("sslaccept") === "accept_invalid_certs" ||
        db.searchParams.get("sslmode") === "disable")
    )
      fail(
        "DATABASE_CERTIFICATE",
        "TLS 비활성화 또는 인증서 검증 우회를 제거하세요.",
      );
  } catch {
    fail("DATABASE_URL", "유효한 DATABASE_URL이 필요합니다.");
  }

  if (!["mock", "live"].includes(env.EXTERNAL_API_MODE ?? "mock"))
    fail("API_MODE", "EXTERNAL_API_MODE은 mock 또는 live로 명시하세요.");
  const live = env.EXTERNAL_API_MODE === "live";
  if (
    live &&
    (env.GOOGLE_PLACES_ENABLED !== "true" || !env.GOOGLE_PLACES_API_KEY)
  )
    fail(
      "PLACES_KEY",
      "live 검색에는 서버용 Places 키와 활성화 설정이 필요합니다.",
    );
  if (
    live &&
    (env.GOOGLE_MAPS_BROWSER_ENABLED !== "true" ||
      !env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  )
    fail(
      "BROWSER_MAP_KEY",
      "실제 지도 활성화 시 브라우저용 Maps JavaScript 키가 필요합니다.",
    );
  if (
    env.GOOGLE_PLACES_API_KEY &&
    env.GOOGLE_PLACES_API_KEY === env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  )
    fail(
      "KEY_SEPARATION",
      "서버 Places 키와 공개 브라우저 지도 키를 분리하세요.",
    );
  for (const [name, fallback, maximum] of [
    ["API_DAILY_LIMIT", "100", 100],
    ["API_MONTHLY_LIMIT", "1000", 4500],
  ] as const) {
    const limit = Number(env[name] || fallback);
    if (!Number.isSafeInteger(limit) || limit < 1 || (live && limit > maximum))
      fail(name, `${name} 설정이 서버의 허용 범위를 벗어났습니다.`);
  }
  if (production && env.FOOD_MAP_PRODUCT_TEST === "true")
    fail("TEST_PRELOAD", "운영 환경에서 제품 테스트 전용 설정을 제거하세요.");
  if (live) {
    warn(
      "GOOGLE_QUOTAS",
      "Cloud Console에서 API별 키 제한과 SKU quota를 직접 확인하세요. 내부 Places 카운터는 지도 로드 비용을 제한하지 않습니다.",
    );
    warn(
      "LIVE_BUDGET",
      "운영 DB의 현재 월 공유 예산과 기존 사용량은 별도로 확인해야 합니다. 이 검사는 DB나 Google에 접속하지 않습니다.",
    );
  }
  if (production) {
    warn(
      "OPERATIONS",
      "백업 복원·DB 방화벽·프록시 HTTPS·보안 패치·정책 확정은 운영 체크리스트에서 확인하세요.",
    );
  }
  return issues;
}
