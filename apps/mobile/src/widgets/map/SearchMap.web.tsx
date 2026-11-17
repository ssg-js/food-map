import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { RegistrationController } from "@food-map/registration";
import { useSearchMap } from "./useSearchMap";
import { MapFrame } from "./MapFrame";
export function SearchMap({
  flow,
  height,
}: {
  flow: RegistrationController;
  height: number;
}) {
  const map = useSearchMap(flow),
    [error, setError] = useState("");
  return (
    <View
      style={{
        height,
        position: "relative",
        backgroundColor: "#e8edf1",
        flexShrink: 0,
      }}
    >
      <MapFrame
        state={map.state}
        onEvent={map.receive}
        onError={() =>
          setError(
            "지도를 불러오지 못했어요. API 서버 연결과 로그인을 확인해주세요.",
          )
        }
      />
      {flow.viewportDirty && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현 지도에서 검색"
          disabled={flow.busy || flow.search.isFetching}
          onPress={flow.searchHere}
          style={{
            position: "absolute",
            top: 48,
            left: "28%",
            backgroundColor: "#3182f6",
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white" }}>현 지도에서 검색</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="현재 위치 표시"
        disabled={map.locating}
        onPress={() => {
          void map.locate();
        }}
        style={{
          position: "absolute",
          right: 8,
          bottom: 8,
          backgroundColor: "white",
          padding: 10,
          borderRadius: 12,
        }}
      >
        <Text>{map.locating ? "위치 확인 중" : "현재 위치 표시"}</Text>
      </Pressable>
      {error || (map.message && !flow.submittedQuery) ? (
        <Text
          style={{
            position: "absolute",
            left: 8,
            bottom: 50,
            right: 8,
            fontSize: 11,
            backgroundColor: "white",
            padding: 4,
          }}
        >
          {error || map.message}
        </Text>
      ) : null}
    </View>
  );
}
