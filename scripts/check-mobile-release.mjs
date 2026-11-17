import nextEnv from "@next/env";
import { createRequire } from "node:module";
import path from "node:path";
if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error("프로젝트의 검증된 Node.js 24를 사용하세요.");
  process.exit(1);
}
const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.resolve("apps/mobile"), false, { info() {}, error() {} });
try {
  if (process.env.EXPO_PUBLIC_LOCAL_QA === "true")
    throw new Error("릴리스에서는 EXPO_PUBLIC_LOCAL_QA를 제거하세요.");
  const require = createRequire(import.meta.url);
  const {
    resolveApiOrigin,
  } = require("../apps/mobile/src/shared/api-origin.ts");
  resolveApiOrigin(process.env.EXPO_PUBLIC_API_URL, "ios", false);
  console.log(
    "앱 릴리스 API origin 검사 통과. 실기기·서명·스토어 검증은 별도로 필요합니다.",
  );
} catch {
  console.error(
    "앱 릴리스 설정이 올바르지 않습니다. QA 모드를 끄고 EXPO_PUBLIC_API_URL을 운영 HTTPS origin으로 설정하세요.",
  );
  process.exitCode = 1;
}
