import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { Place } from "@food-map/registration";
import { MapFrame } from "./MapFrame";
import { usePreviewMap } from "./usePreviewMap";
export function MapPreview({
  place,
  points,
  onSelect,
}: {
  place?: Place | null;
  points?: Place[];
  onSelect?: (p: Place) => void;
}) {
  const map = usePreviewMap(place, points, onSelect);
  const [error, setError] = useState("");
  return (
    <View
      style={{
        height: 280,
        backgroundColor: "#e8edf1",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MapFrame
        state={map.state}
        onEvent={map.receive}
        onError={() =>
          setError(
            "지도를 불러오지 못했어요. 네트워크와 로그인을 확인해주세요.",
          )
        }
      />
      {!!points?.length && (
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: 4,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {points.map((p, i) => (
            <Pressable
              key={p.placeId}
              accessibilityRole="button"
              onPress={() => onSelect?.(p)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                padding: 8,
                borderRadius: 10,
                backgroundColor:
                  p.placeId === place?.placeId ? "#d0e6ff" : "white",
              }}
            >
              <Text>
                {i + 1}. {p.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {error || map.message ? (
        <Text
          accessibilityRole="alert"
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 62,
            padding: 8,
            backgroundColor: "white",
            fontSize: 12,
          }}
        >
          {error || map.message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="현재 위치 표시"
        disabled={map.locating}
        onPress={() => {
          setError("");
          void map.locate();
        }}
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          padding: 12,
          minHeight: 44,
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text>{map.locating ? "위치 확인 중" : "현재 위치 표시"}</Text>
      </Pressable>
    </View>
  );
}
