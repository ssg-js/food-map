import { useState } from "react";
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
export function MapPreview({ place }: { place?: Place | null }) {
  const [position, setPosition] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null),
    [error, setError] = useState("");
  const { requestPosition, locating, message } = useCurrentLocation();
  const q = new URLSearchParams();
  if (position) {
    q.set("lat", String(position.latitude));
    q.set("lng", String(position.longitude));
  } else if (place?.location) {
    q.set("lat", String(place.location.latitude));
    q.set("lng", String(place.location.longitude));
  }
  const uri = `${apiBaseUrl}/map-preview?${q}`;
  return (
    <View style={s.map}>
      {place?.location || position ? (
        <WebView
          key={uri}
          source={{ uri }}
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
      ) : (
        <View style={s.empty}>
          <Text style={s.heading}>지도에서 맛집을 확인해요</Text>
          <Text>검색 결과나 저장한 장소를 선택해주세요.</Text>
        </View>
      )}
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
              setPosition(p);
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
