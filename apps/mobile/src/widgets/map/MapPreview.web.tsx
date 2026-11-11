import { View, Text, StyleSheet } from "react-native";
import type { Place } from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
export function MapPreview({ place }: { place?: Place | null }) {
  return (
    <View style={s.map}>
      {place?.location ? (
        <iframe
          title={`${place.name} 위치`}
          src={`${apiBaseUrl}/map-preview?${new URLSearchParams({ lat: String(place.location?.latitude ?? ""), lng: String(place.location?.longitude ?? "") })}`}
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
