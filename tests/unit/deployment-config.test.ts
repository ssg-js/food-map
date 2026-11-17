import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectDeployment } from "../../src/shared/config/deployment";
const safe = {
  DEPLOYMENT_ENV: "production",
  DATABASE_URL:
    "postgresql://app:fixture-password@db.example.net/food_map?sslmode=require",
  BETTER_AUTH_SECRET: "fixture-random-mock-auth-6b7d84ac9e1f2035",
  PERSONAL_SETUP_TOKEN: "fixture-random-setup-0f1a2b3c4d5e6f78",
  AUTH_BASE_URL: "https://food-map.example.net",
  AUTH_TRUSTED_ORIGINS: "https://food-map.example.net",
  EXTERNAL_API_MODE: "mock",
};
const errors = (env: Record<string, string | undefined>) =>
  inspectDeployment(env, true)
    .filter((v) => v.severity === "error")
    .map((v) => v.id);
test("production checks accept isolated HTTPS mock deployment without external API credentials", () => {
  assert.deepEqual(errors(safe), []);
});
test("cloud runtime marker, strong secrets and strict trusted origins cannot silently fall back to local defaults", () => {
  const invalid = {
    ...safe,
    DEPLOYMENT_ENV: undefined,
    BETTER_AUTH_SECRET: "short",
    AUTH_BASE_URL: "http://localhost:3000",
    AUTH_TRUSTED_ORIGINS: "*",
  };
  for (const id of [
    "RUNTIME_GUARD",
    "AUTH_SECRET",
    "AUTH_ORIGIN",
    "TRUSTED_ORIGINS",
  ])
    assert.ok(errors(invalid).includes(id));
  assert.ok(
    errors({
      ...safe,
      AUTH_BASE_URL: "https://user:password@food-map.example.net",
    }).includes("AUTH_ORIGIN"),
  );
  assert.ok(
    errors({
      ...safe,
      AUTH_TRUSTED_ORIGINS: "https://other.example.net",
    }).includes("TRUSTED_ORIGINS"),
  );
});
test("cloud database rejects developer DB, unencrypted connections and invalid certificates", () => {
  assert.ok(
    errors({
      ...safe,
      DATABASE_URL: "postgresql://user:pass@127.0.0.1:5432/dev",
    }).includes("DATABASE_TARGET"),
  );
  assert.ok(
    errors({
      ...safe,
      DATABASE_URL: "postgresql://user:pass@db.example.net/food",
    }).includes("DATABASE_TLS"),
  );
  assert.ok(
    errors({
      ...safe,
      DATABASE_URL: safe.DATABASE_URL + "&sslaccept=accept_invalid_certs",
    }).includes("DATABASE_CERTIFICATE"),
  );
});
test("live mode requires separate Places and browser credentials plus bounded integer quotas", () => {
  const live = { ...safe, EXTERNAL_API_MODE: "live" };
  assert.ok(errors(live).includes("PLACES_KEY"));
  assert.ok(errors(live).includes("BROWSER_MAP_KEY"));
  const configured = {
    ...live,
    GOOGLE_PLACES_ENABLED: "true",
    GOOGLE_PLACES_API_KEY: "fixture-server-key",
    GOOGLE_MAPS_BROWSER_ENABLED: "true",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "fixture-browser-key",
  };
  assert.deepEqual(errors(configured), []);
  assert.ok(
    errors({
      ...configured,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: configured.GOOGLE_PLACES_API_KEY,
    }).includes("KEY_SEPARATION"),
  );
  assert.ok(
    errors({ ...configured, API_MONTHLY_LIMIT: "999999" }).includes(
      "API_MONTHLY_LIMIT",
    ),
  );
  assert.ok(
    errors({ ...configured, API_DAILY_LIMIT: "NaN" }).includes(
      "API_DAILY_LIMIT",
    ),
  );
});
test("deployment diagnostics contain only field names and explanations, never configured secrets or DB credentials", () => {
  const env = {
    ...safe,
    BETTER_AUTH_SECRET: "sensitive-placeholder-value",
    DATABASE_URL:
      "postgresql://account:sensitive-db-password@db.example.net/food",
  };
  const text = JSON.stringify(inspectDeployment(env, true));
  assert.ok(!text.includes(env.BETTER_AUTH_SECRET));
  assert.ok(!text.includes("sensitive-db-password"));
});
test("local development warnings do not prevent existing local mock workflow", () => {
  assert.equal(
    inspectDeployment({}, false).some((v) => v.severity === "error"),
    false,
  );
  assert.ok(
    errors({ ...safe, FOOD_MAP_PRODUCT_TEST: "true" }).includes("TEST_PRELOAD"),
  );
});

test("production server startup rejects unsafe config before serving requests without exposing values", async () => {
  const keys = [
    "NEXT_RUNTIME",
    "DEPLOYMENT_ENV",
    "VERCEL_ENV",
    "BETTER_AUTH_SECRET",
    "DATABASE_URL",
    "AUTH_BASE_URL",
    "AUTH_TRUSTED_ORIGINS",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    Object.assign(process.env, {
      NEXT_RUNTIME: "nodejs",
      DEPLOYMENT_ENV: "production",
      VERCEL_ENV: "",
      BETTER_AUTH_SECRET: "unsafe-private-value",
      DATABASE_URL: "postgresql://user:secret-value@localhost/dev",
      AUTH_BASE_URL: "http://localhost:3000",
      AUTH_TRUSTED_ORIGINS: "*",
    });
    const { register } = await import("../../src/instrumentation");
    await assert.rejects(register(), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Deployment configuration rejected/);
      assert.match(error.message, /AUTH_SECRET/);
      assert.ok(!error.message.includes("unsafe-private-value"));
      assert.ok(!error.message.includes("secret-value"));
      return true;
    });
  } finally {
    for (const key of keys)
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
  }
});
