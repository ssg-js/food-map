"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  readMapState,
  type SearchMapState,
  type SearchMapEvent,
} from "@food-map/registration";
import { GooglePointMap } from "./GooglePointMap";
const initial: SearchMapState = {
  type: "map-state",
  center: { latitude: 37.5665, longitude: 126.978 },
  title: "기본 지도 · 서울시청",
  points: [],
  activeId: null,
};
export function SearchMapBridge({ mode }: { mode: "mock" | "live" }) {
  const [state, setState] = useState(initial);
  const emit = useCallback((event: SearchMapEvent) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(event));
    if (window.parent !== window)
      window.parent.postMessage(event, window.location.origin);
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const native = !event.origin && !!window.ReactNativeWebView;
      const web =
        event.origin === window.location.origin &&
        event.source === window.parent;
      if (!native && !web) return;
      try {
        const data =
          typeof event.data === "string"
            ? event.data.length < 30000
              ? JSON.parse(event.data)
              : null
            : event.data;
        const next = readMapState(data);
        if (next) setState(next);
      } catch {}
    };
    window.addEventListener("message", receive);
    const frame = requestAnimationFrame(() => emit({ type: "map-ready" }));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("message", receive);
    };
  }, [emit]);
  const points = useMemo(
    () =>
      state.points.flatMap((p) =>
        p.location ? [{ id: p.placeId, title: p.name, ...p.location }] : [],
      ),
    [state.points],
  );
  const bounds = useCallback(
    (bounds: import("@food-map/registration").MapViewport) =>
      emit({ type: "viewport", bounds }),
    [emit],
  );
  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <GooglePointMap
        {...state.center}
        title={state.title}
        userLocation={state.userLocation}
        centerRevision={state.centerRevision}
        showMarker={false}
        mode={mode}
        points={points}
        activeId={state.activeId}
        fitToPoints={false}
        onViewportChange={bounds}
        onSelect={(id) => emit({ type: "select", id })}
        onHover={(id) => emit({ type: "hover", id })}
      />
    </main>
  );
}
