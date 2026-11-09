import { useState } from "react";
import * as Location from "expo-location";
export function useCurrentLocation() {
  const [locating, setLocating] = useState(false);
  const [permission, setPermission] = useState(false);
  const [message, setMessage] = useState("");
  async function requestPosition(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    if (locating) return null;
    setLocating(true);
    setMessage("");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const granted = await Location.requestForegroundPermissionsAsync();
      if (granted.status !== "granted") {
        setMessage("위치 권한 없이도 장소를 검색하고 등록할 수 있어요.");
        return null;
      }
      setPermission(true);
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Location timeout")),
            12_000,
          );
        }),
      ]);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      setMessage("현재 위치를 확인하지 못했어요. 기본 지도를 표시해요.");
      return null;
    } finally {
      clearTimeout(timeout);
      setLocating(false);
    }
  }
  return { locating, permission, message, requestPosition };
}
