import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="220" fill="#3182f6"/><path d="M512 216c-132 0-230 98-230 222 0 166 230 370 230 370s230-204 230-370c0-124-98-222-230-222Z" fill="white"/><circle cx="512" cy="436" r="85" fill="#3182f6"/></svg>`,
);
await mkdir("public/icons", { recursive: true });
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["maskable-512", 512],
  ["apple-touch-icon", 180],
])
  await sharp(svg).resize(size, size).png().toFile(`public/icons/${name}.png`);
await mkdir("apps/mobile/assets", { recursive: true });
await sharp(svg).png().toFile("apps/mobile/assets/food-map-icon.png");
console.log("PWA and mobile icons generated");
