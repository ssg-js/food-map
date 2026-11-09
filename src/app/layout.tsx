import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { PwaRuntime } from "@/features/pwa/components/PwaRuntime";
import "./globals.css";
export const metadata: Metadata = {
  title: "맛집지도 · 발견한 맛집을 카테고리로",
  description: "장소를 검색하고, 함께 쓰는 카테고리로 맛집을 정리하세요.",
  applicationName: "맛집지도",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "맛집지도" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3182f6",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
          <PwaRuntime />
        </Providers>
      </body>
    </html>
  );
}
