import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { createRequire } from "node:module";
if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error("프로젝트의 검증된 Node.js 24를 사용하세요.");
  process.exit(1);
}
const require = createRequire(import.meta.url);
const { inspectDeployment } = require("../src/shared/config/deployment.ts");
const production = process.argv.includes("--production");
// Same .env precedence as Next.js. The loader's diagnostics never print values.
loadEnvConfig(process.cwd(), !production, { info() {}, error() {} });
const issues = inspectDeployment(process.env, production);
const errors = issues.filter((issue) => issue.severity === "error").length;
if (process.argv.includes("--json"))
  console.log(
    JSON.stringify(
      {
        profile: production ? "production" : "local",
        ok: errors === 0,
        issues,
      },
      null,
      2,
    ),
  );
else {
  for (const issue of issues)
    console.log(`[${issue.severity}] ${issue.id}: ${issue.message}`);
  console.log(
    errors
      ? `배포 사전검증 실패: ${errors}개 설정을 확인하세요.`
      : "설정 검사 통과. 실제 인프라·Google 설정의 검증을 대신하지 않습니다.",
  );
}
process.exitCode = errors ? 1 : 0;
