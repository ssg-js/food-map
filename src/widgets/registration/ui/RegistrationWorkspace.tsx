"use client";
import { createRegistrationApi, useRegistration } from "@food-map/registration";
import { SelectedPlaceMap } from "@/features/map/components/SelectedPlaceMap";
import { PlaceRegistrationPanel } from "@/features/place-registration/components/PlaceRegistrationPanel";
const api = createRegistrationApi();
export function RegistrationWorkspace({
  ownerId,
  mode,
  mapKey,
}: {
  ownerId: string;
  mode: "mock" | "live";
  mapKey: string;
}) {
  const flow = useRegistration(api, ownerId);
  return (
    <main className="workspace">
      <PlaceRegistrationPanel flow={flow} />
      <section className="map-pane" aria-label="주변 지도">
        <SelectedPlaceMap
          mode={mode}
          apiKey={mapKey}
          showLocationMessage={!flow.submittedQuery}
          searchMode
          selectedPlace={flow.selectedPlace}
          points={flow.search.data || []}
          onSelect={flow.selectPlace}
          onViewportChange={flow.setViewport}
          activeId={flow.hoveredId ?? flow.selectedPlace?.placeId}
          onHover={flow.setHoveredId}
        />
        {flow.viewportDirty && (
          <button
            className="button button-primary search-this-map"
            onClick={flow.searchHere}
            disabled={flow.busy || flow.search.isFetching}
          >
            {flow.search.isFetching ? "검색 중…" : "현 지도에서 검색"}
          </button>
        )}
      </section>
    </main>
  );
}
