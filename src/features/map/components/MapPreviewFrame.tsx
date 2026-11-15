"use client";
import { useState } from "react";
import { GooglePointMap, type MapPoint } from "./GooglePointMap";
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}
export function MapPreviewFrame({
  initial,
  points,
  mode,
  view,
}: {
  initial: { latitude: number; longitude: number };
  points: MapPoint[];
  mode: "mock" | "live";
  view?: string;
}) {
  const [selected, setSelected] = useState<MapPoint | null>(null);
  return (
    <GooglePointMap
      {...(selected || initial)}
      mode={mode}
      title={
        selected?.title ||
        (view === "current"
          ? "현재 위치"
          : view === "fallback"
            ? "기본 지도 · 서울시청"
            : "선택한 위치")
      }
      showMarker={!!selected || view !== "fallback"}
      points={points}
      onSelect={(id) => {
        const point = points.find((p) => p.id === id);
        if (!point) return;
        setSelected(point);
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: "place-selected", id }),
        );
        window.parent.postMessage(
          { type: "place-selected", id },
          window.location.origin,
        );
      }}
    />
  );
}
