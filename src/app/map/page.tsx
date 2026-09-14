import { MapView } from "@/features/map/components/MapView";
import { PlaceRegistrationPanel } from "@/features/place-registration/components/PlaceRegistrationPanel";
import { MapProvider } from "@/widgets/map";

export default function MapPage() {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold">맛집 지도</h1>
      </header>
      <div className="relative flex flex-1 min-h-0">
        <MapProvider providerType="google">
          <MapView />
        </MapProvider>
        <PlaceRegistrationPanel />
      </div>
    </div>
  );
}
