import { useCurrentLocation } from "../../features/location/useCurrentLocation";
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Place } from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
export function MapPreview({
  place,
  points,
  onSelect,
}: {
  place?: Place | null;
  points?: Place[];
  onSelect?: (p: Place) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
    forPlaceId?: string;
  } | null>(null);
  const { requestPosition, locating, message } = useCurrentLocation();

  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (
        e.origin !== new URL(apiBaseUrl).origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      const p = points?.find((p) => p.placeId === e.data?.id);
      if (e.data?.type === "place-selected" && p) onSelect?.(p);
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [points, onSelect]);
  const started = useRef(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      void requestPosition().then((p) => {
        if (active && p) setPosition({ ...p, forPlaceId: place?.placeId });
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [requestPosition, place]);
  const currentPosition =
    position?.forPlaceId === place?.placeId ? position : null;
  const center = currentPosition ??
    place?.location ?? { latitude: 37.5665, longitude: 126.978 };
  const view = currentPosition
    ? "current"
    : place?.location
      ? "selected"
      : "fallback";

  return (
    <View style={s.map}>
      {message ? (
        <Text
          accessibilityRole="alert"
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 20,
            backgroundColor: "white",
            padding: 8,
          }}
        >
          {message}
        </Text>
      ) : null}
      <Text
        accessibilityRole="button"
        onPress={() => {
          void requestPosition().then((p) => {
            if (p) setPosition({ ...p, forPlaceId: place?.placeId });
          });
        }}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 20,
          backgroundColor: "white",
          padding: 12,
        }}
      >
        {locating ? "위치 확인 중" : "현재 위치 표시"}
      </Text>

      {points?.length ? (
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: 4,
            zIndex: 10,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {points.map((p, i) => (
            <Text
              key={p.placeId}
              accessibilityRole="button"
              onPress={() => onSelect?.(p)}
              style={{
                backgroundColor:
                  p.placeId === place?.placeId ? "#d0e6ff" : "white",
                padding: 8,
                borderRadius: 12,
              }}
            >
              {i + 1}. {p.name}
            </Text>
          ))}
        </View>
      ) : null}
      {
        <iframe
          ref={frame}
          title={`${currentPosition ? "현재 위치" : place?.name || "기본 지도"} 위치`}
          src={`${apiBaseUrl}/map-preview?${new URLSearchParams({ lat: String(center.latitude), lng: String(center.longitude), view, points: JSON.stringify((currentPosition ? [] : points)?.flatMap((p) => (p.location ? [{ id: p.placeId, ...p.location }] : [])) || []) })}`}
          style={{ width: "100%", height: 260, border: 0 }}
        />
      }
    </View>
  );
}
const s = StyleSheet.create({
  map: { height: 260, backgroundColor: "#e8edf1" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  title: { fontSize: 17, fontWeight: "700", color: "#191f28" },
});
