import { SearchMapBridge } from "@/features/map/components/SearchMapBridge";
export const metadata = {
  title: "지도 범위 검색",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function SearchMap() {
  return (
    <SearchMapBridge
      mode={process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock"}
    />
  );
}
