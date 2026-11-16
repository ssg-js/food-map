import { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import {
  readMapEvent,
  type RegistrationController,
} from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
import { useSearchMap } from "./useSearchMap";
export function SearchMap({
  flow,
  height,
}: {
  flow: RegistrationController;
  height: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    map = useSearchMap(flow),
    origin = new URL(apiBaseUrl).origin;
  const { latest } = map;
  const send = () =>
    frame.current?.contentWindow?.postMessage(latest.current.state, origin);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(map.state, origin);
  }, [map.state, origin]);
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow)
        return;
      const event = readMapEvent(e.data);
      if (!event) return;
      if (event.type === "map-ready")
        frame.current?.contentWindow?.postMessage(
          map.latest.current.state,
          origin,
        );
      else map.latest.current.receive(event);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [map.latest, origin]);
  return (
    <View
      style={{
        height,
        position: "relative",
        backgroundColor: "#e8edf1",
        flexShrink: 0,
      }}
    >
      <iframe
        ref={frame}
        title="검색 지도"
        src={`${apiBaseUrl}/map-search`}
        onLoad={send}
        style={{ width: "100%", height: "100%", border: 0 }}
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
      {map.message && !flow.submittedQuery ? (
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
          {map.message}
        </Text>
      ) : null}
    </View>
  );
}
