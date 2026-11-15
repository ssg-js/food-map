import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import type { Place } from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
import { useCurrentLocation } from "../../features/location/useCurrentLocation";
export function MapPreview({
  place,
  points,
  onSelect,
}: {
  place?: Place | null;
  points?: Place[];
  onSelect?: (p: Place) => void;
}) {
  const [position, setPosition] = useState<{
      latitude: number;
      longitude: number;
      forPlaceId?: string;
    } | null>(null),
    [error, setError] = useState("");
  const { requestPosition, locating, message } = useCurrentLocation();
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
  const q = new URLSearchParams();
  q.set("lat", String(center.latitude));
  q.set("lng", String(center.longitude));
  q.set("view", view);
  if (!currentPosition && points?.length)
    q.set(
      "points",
      JSON.stringify(
        points.flatMap((p) =>
          p.location ? [{ id: p.placeId, ...p.location }] : [],
        ),
      ),
    );
  const uri = `${apiBaseUrl}/map-preview?${q}`;
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
      {
        <WebView
          key={uri}
          source={{ uri }}
          onMessage={(e) => {
            try {
              const b = JSON.parse(e.nativeEvent.data);
              const p = points?.find((p) => p.placeId === b.id);
              if (b.type === "place-selected" && p) {
                setPosition(null);
                onSelect?.(p);
              }
            } catch {}
          }}
          style={s.web}
          originWhitelist={[new URL(apiBaseUrl).origin]}
          onError={() =>
            setError(
              "지도 서버에 연결하지 못했어요. 네트워크와 API 주소를 확인해주세요.",
            )
          }
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={s.loading} />}
        />
      }
      {error || message ? (
        <Text accessibilityRole="alert" style={s.message}>
          {error || message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="현재 위치 표시"
        disabled={locating}
        style={s.location}
        onPress={() => {
          void requestPosition().then((p) => {
            if (p) {
              setPosition({ ...p, forPlaceId: place?.placeId });
              setError("");
            }
          });
        }}
      >
        <Text>{locating ? "위치 확인 중" : "◎ 현재 위치"}</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  map: { height: 280, backgroundColor: "#e8edf1", overflow: "hidden" },
  web: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  heading: { fontSize: 17, fontWeight: "700", color: "#191f28" },
  location: {
    position: "absolute",
    bottom: 18,
    right: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    minHeight: 44,
  },
  message: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    fontSize: 12,
  },
  loading: { position: "absolute", top: 110, left: 0, right: 0 },
});
