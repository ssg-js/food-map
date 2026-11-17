import { requirePageUser } from "@/shared/lib/personal-access";
import { SearchMapBridge } from "@/features/map/components/SearchMapBridge";
export const metadata = {
  title: "지도 범위 검색",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function SearchMap() {
  await requirePageUser();
  return (
    <SearchMapBridge
      mode={process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock"}
    />
  );
}
