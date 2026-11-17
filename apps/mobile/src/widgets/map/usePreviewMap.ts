import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Place,
  SearchMapState,
  SearchMapEvent,
} from "@food-map/registration";
import { useCurrentLocation } from "../../features/location/useCurrentLocation";
export function usePreviewMap(
  place: Place | null | undefined,
  points: Place[] | undefined,
  onSelect: ((p: Place) => void) | undefined,
) {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
    forPlaceId?: string;
  } | null>(null);
  const [centerRevision, setCenterRevision] = useState(0);
  const { requestPosition, locating, message } = useCurrentLocation();
  const started = useRef(false);
  const initialPlaceId = useRef(place?.placeId);
  const locate = useCallback(async () => {
    const p = await requestPosition();
    if (p) {
      setPosition({ ...p, forPlaceId: place?.placeId });
      setCenterRevision((v) => v + 1);
    }
  }, [requestPosition, place?.placeId]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      void requestPosition().then((p) => {
        if (active && p) {
          setPosition({ ...p, forPlaceId: initialPlaceId.current });
          setCenterRevision((v) => v + 1);
        }
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [requestPosition]);
  const current = position?.forPlaceId === place?.placeId ? position : null;
  const center = current ??
    place?.location ??
    position ?? { latitude: 37.5665, longitude: 126.978 };
  const state = useMemo<SearchMapState>(
    () => ({
      type: "map-state",
      center: { latitude: center.latitude, longitude: center.longitude },
      centerRevision,
      ...(position
        ? {
            userLocation: {
              latitude: position.latitude,
              longitude: position.longitude,
            },
          }
        : {}),
      title: current
        ? "현재 위치"
        : (place?.name ?? (position ? "현재 위치" : "기본 지도 · 서울시청")),
      points: (points ?? []).slice(0, 12),
      activeId: place?.placeId ?? null,
    }),
    [
      center.latitude,
      center.longitude,
      centerRevision,
      position,
      current,
      place?.name,
      place?.placeId,
      points,
    ],
  );
  const receive = useCallback(
    (event: SearchMapEvent) => {
      if (event.type !== "select") return;
      const selected = points?.find((p) => p.placeId === event.id);
      if (selected) onSelect?.(selected);
    },
    [points, onSelect],
  );
  return { state, receive, locate, locating, message };
}
