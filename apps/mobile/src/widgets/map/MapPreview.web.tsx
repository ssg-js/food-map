import { useEffect, useRef } from "react";
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
  return (
    <View style={s.map}>
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
      {place?.location ? (
        <iframe
          ref={frame}
          title={`${place.name} 위치`}
          src={`${apiBaseUrl}/map-preview?${new URLSearchParams({ lat: String(place.location?.latitude ?? ""), lng: String(place.location?.longitude ?? ""), points: JSON.stringify(points?.flatMap((p) => (p.location ? [{ id: p.placeId, ...p.location }] : [])) || []) })}`}
          style={{ width: "100%", height: 260, border: 0 }}
        />
      ) : (
        <View style={s.empty}>
          <Text style={s.title}>지도 미리보기</Text>
          <Text>장소를 선택하면 Google 지도에 핀이 표시돼요.</Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  map: { height: 260, backgroundColor: "#e8edf1" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  title: { fontSize: 17, fontWeight: "700", color: "#191f28" },
});
