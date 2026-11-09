import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "맛집지도", short_name: "맛집지도", description: "발견한 맛집을 카테고리로 정리해요", lang: "ko", start_url: "/map", scope: "/", display: "standalone", background_color: "#f2f4f6", theme_color: "#3182f6", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}
