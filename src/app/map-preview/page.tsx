import { MapPreviewFrame } from "@/features/map/components/MapPreviewFrame";
import { z } from "zod";
export const metadata = {
  title: "맛집 위치",
  robots: { index: false, follow: false },
};
export default async function MapPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams,
    key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const latitude = Number(params.lat),
    longitude = Number(params.lng);
  if (
    (process.env.EXTERNAL_API_MODE === "live" && !key) ||
    !params.lat ||
    !params.lng ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    return (
      <p style={{ padding: 24 }}>
        장소 위치를 확인할 수 없어요. 장소 정보를 다시 조회해주세요.
      </p>
    );
  const decoded = z
    .array(
      z.object({
        id: z.string().max(512),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .max(12)
    .safeParse(
      (() => {
        try {
          return JSON.parse((params.points || "[]").slice(0, 12000));
        } catch {
          return [];
        }
      })(),
    );
  const points = decoded.success
    ? decoded.data.map((p, i) => ({ ...p, title: `맛집 ${i + 1}` }))
    : [];
  return (
    <main style={{ position: "fixed", inset: 0, background: "#f2f4f6" }}>
      <MapPreviewFrame
        initial={{ latitude, longitude }}
        points={points}
        mode={process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock"}
      />
    </main>
  );
}
