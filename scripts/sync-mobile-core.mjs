import { cp, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "packages/registration/src");
const destination = path.join(
  root,
  "apps/mobile/node_modules/@food-map/registration",
);
const actual = await realpath(destination);
if (actual !== destination)
  throw new Error(
    "앱 공통 패키지는 install-links=true로 설치해야 합니다. npm run mobile:install을 실행해주세요.",
  );
await cp(source, path.join(destination, "src"), { recursive: true });
console.log("Native registration package refreshed from shared source");
