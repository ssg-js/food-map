import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  [
    "node_modules/expo/bin/cli",
    "export",
    "--platform",
    "web",
    "--output-dir",
    "dist-web",
  ],
  {
    cwd: "apps/mobile",
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: "http://127.0.0.1:3200",
      EXPO_NO_TELEMETRY: "1",
    },
  },
);
process.exit(result.status ?? 1);
