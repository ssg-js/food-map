import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
      GOOGLE_PLACES_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
process.exit(result.status ?? 1);
