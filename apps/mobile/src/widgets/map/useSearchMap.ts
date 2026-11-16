import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type RegistrationController,
  type SearchMapEvent,
  type SearchMapState,
} from "@food-map/registration";
import { useCurrentLocation } from "../../features/location/useCurrentLocation";
export function useSearchMap(flow: RegistrationController) {
  const [center, setCenter] = useState({
      latitude: 37.5665,
      longitude: 126.978,
    }),
    [located, setLocated] = useState(false);
  const { requestPosition, locating, message } = useCurrentLocation();
  const locate = useCallback(async () => {
    const p = await requestPosition();
    if (p) {
      setCenter(p);
      setLocated(true);
    }
  }, [requestPosition]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void locate();
    }, 0);
    return () => clearTimeout(timer);
  }, [locate]);
  const state = useMemo<SearchMapState>(
    () => ({
      type: "map-state",
      center,
      title:
        flow.selectedPlace?.name ||
        (located ? "현재 위치" : "기본 지도 · 서울시청"),
      points: flow.search.data || [],
      activeId: flow.hoveredId ?? flow.selectedPlace?.placeId ?? null,
    }),
    [center, located, flow.selectedPlace, flow.search.data, flow.hoveredId],
  );
  const receive = useCallback(
    (event: SearchMapEvent) => {
      if (event.type === "viewport") flow.setViewport(event.bounds);
      if (event.type === "hover") flow.setHoveredId(event.id);
      if (event.type === "select") {
        const p = flow.search.data?.find((p) => p.placeId === event.id);
        if (p) flow.selectPlace(p);
      }
    },
    [flow],
  );
  const latest = useRef({ state, receive });
  useEffect(() => {
    latest.current = { state, receive };
  }, [state, receive]);
  return { state, receive, latest, locate, locating, message };
}
