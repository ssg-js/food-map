import { GooglePointMap } from "@/features/map/components/GooglePointMap";
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
    !key ||
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
  return (
    <main style={{ position: "fixed", inset: 0, background: "#f2f4f6" }}>
      <GooglePointMap
        latitude={latitude}
        longitude={longitude}
        title="선택한 위치"
      />
    </main>
  );
}
