import { useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";
import { useCurrentLocation } from "../../features/location/useCurrentLocation";
import { theme as t } from "../../shared/theme";
const INITIAL_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};
export function MapPreview() {
  const map = useRef<MapView>(null);
  const { locating, permission, message, requestPosition } =
    useCurrentLocation();
  const hasMap =
    Platform.OS === "ios" ||
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY);
  async function locate() {
    const position = await requestPosition();
    if (position) {
      map.current?.animateToRegion(
        {
          ...INITIAL_REGION,
          ...position,
        },
        350,
      );
    }
  }
  return (
    <View style={styles.container}>
      {hasMap ? (
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          showsUserLocation={permission}
          showsMyLocationButton={false}
          showsPointsOfInterests={false}
          showsCompass={false}
        />
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.roadA} />
          <View style={styles.roadB} />
          <Text style={styles.placeholderText}>
            지도 연결 준비 중 · 장소 검색과 등록은 이용할 수 있어요
          </Text>
        </View>
      )}
      <View style={styles.notice} pointerEvents="none">
        <Text style={styles.noticeTitle}>지도 미리보기</Text>
        <Text style={styles.noticeBody}>
          등록한 맛집의 지도 표시는 준비 중이에요.
        </Text>
      </View>
      {message ? (
        <Text style={styles.locationMessage} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
      {hasMap && (
        <Pressable
          onPress={() => {
            void locate();
          }}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 지도 이동"
          style={styles.locationButton}
        >
          {locating ? (
            <ActivityIndicator color={t.blue} />
          ) : (
            <Text style={styles.locationIcon}>◎</Text>
          )}
        </Pressable>
      )}
      {!hasMap && (
        <Text style={styles.sampleLabel}>예시 배경 · 실제 지도가 아니에요</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { height: 205, backgroundColor: "#e8edf1", overflow: "hidden" },
  notice: {
    position: "absolute",
    top: 16,
    left: 18,
    right: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,.96)",
    borderRadius: 14,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: t.text,
    marginBottom: 4,
  },
  noticeBody: { fontSize: 11, color: t.muted, lineHeight: 17 },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  roadA: {
    position: "absolute",
    width: "180%",
    height: 20,
    backgroundColor: "white",
    transform: [{ rotate: "-24deg" }],
  },
  roadB: {
    position: "absolute",
    width: "180%",
    height: 15,
    backgroundColor: "white",
    transform: [{ rotate: "55deg" }],
  },
  placeholderText: {
    fontSize: 10,
    color: t.muted,
    marginTop: 65,
    backgroundColor: "#eef1f4",
    padding: 5,
  },
  locationButton: {
    position: "absolute",
    bottom: 30,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  locationIcon: { fontSize: 30, color: t.blue },
  locationMessage: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 76,
    padding: 8,
    fontSize: 10,
    lineHeight: 16,
    backgroundColor: "white",
    borderRadius: 8,
    color: t.muted,
  },
  sampleLabel: {
    position: "absolute",
    bottom: 28,
    left: 18,
    color: t.muted,
    fontSize: 9,
  },
});
