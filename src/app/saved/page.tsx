import { SavedRestaurants } from "@/features/catalog/components/SavedRestaurants";
export const metadata = { title: "저장한 맛집 · 맛집지도" };
export default function SavedPage() {
  return (
    <SavedRestaurants
      mapKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
