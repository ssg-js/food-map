"use client";
import { useEffect, useRef, useState } from "react";
import { MockPointMap } from "./MockPointMap";
import type { Marker } from "@/widgets/map/model/marker";
import type { MapCoordinate, MapViewport } from "@food-map/registration";
import { GoogleMapProvider } from "@/widgets/map/model/google-map-provider";
export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
};
export type PointProps = {
  onViewportChange?: (bounds: MapViewport) => void;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  fitToPoints?: boolean;
  latitude: number;
  longitude: number;
  title: string;
  mode?: "mock" | "live";
  showMarker?: boolean;
  userLocation?: MapCoordinate;
  centerRevision?: number;
  points?: MapPoint[];
  onSelect?: (id: string) => void;
};
function LivePointMap({
  latitude,
  longitude,
  title,
  points,
  onSelect,
  showMarker = true,
  userLocation,
  centerRevision,
  onViewportChange,
  activeId,
  fitToPoints = true,
}: PointProps) {
  const container = useRef<HTMLDivElement>(null),
    provider = useRef<GoogleMapProvider | null>(null),
    initial = useRef({ latitude, longitude });
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    const map = new GoogleMapProvider();
    provider.current = map;
    void map
      .initialize(container.current, { center: initial.current, zoom: 16 })
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            "지도를 불러오지 못했어요. 네트워크와 Google Maps 키의 웹사이트 제한을 확인해주세요.",
          );
      });
    return () => {
      active = false;
      map.destroy();
      provider.current = null;
    };
  }, []);
  useEffect(() => {
    const fail = () =>
      setError(
        "Google 지도에서 이 주소의 접근을 허용하지 않았어요. 키의 웹사이트 제한에 현재 개발 주소를 추가해주세요.",
      );
    window.addEventListener("food-map-google-auth-error", fail);
    return () => window.removeEventListener("food-map-google-auth-error", fail);
  }, []);
  useEffect(() => {
    if (ready) provider.current?.panTo({ latitude, longitude });
  }, [ready, latitude, longitude, centerRevision]);
  useEffect(() => {
    if (!ready || !provider.current) return;
    const map = provider.current;
    const markers: Marker[] = (points || []).map((p) => ({
      id: p.id,
      coordinate: { latitude: p.latitude, longitude: p.longitude },
      title: p.title,
    }));
    if (!markers.length && showMarker && !userLocation)
      markers.push({
        id: "selected-place",
        coordinate: { latitude, longitude },
        title,
      });
    if (userLocation) {
      markers.push({
        id: "current-user-location-halo",
        kind: "user-location-halo",
        coordinate: userLocation,
        title: "현재 위치",
      });
      markers.push({
        id: "current-user-location",
        kind: "user-location",
        coordinate: userLocation,
        title: "현재 위치",
      });
    }
    const ids = new Set(markers.map((m) => m.id));
    for (const m of map.getMarkers())
      if (!ids.has(m.id)) map.removeMarker(m.id);
    for (const marker of markers) map.updateMarker(marker);
    if (fitToPoints && points?.length) map.fitPoints(points);
    map.highlightMarker(activeId || null);
  }, [
    ready,
    points,
    showMarker,
    userLocation,
    title,
    latitude,
    longitude,
    fitToPoints,
    activeId,
  ]);
  useEffect(() => {
    const map = provider.current;
    if (!ready || !map || !onViewportChange) return;
    const report = () => {
      const b = map.getBounds();
      if (b)
        onViewportChange({
          south: b.southwest.latitude,
          west: b.southwest.longitude,
          north: b.northeast.latitude,
          east: b.northeast.longitude,
        });
    };
    let frame = 0;
    const changed = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(report);
    };
    map.on("idle", report);
    map.on("bounds_changed", changed);
    report();
    return () => {
      cancelAnimationFrame(frame);
      map.off("idle", report);
      map.off("bounds_changed", changed);
    };
  }, [ready, onViewportChange]);
  useEffect(() => {
    const map = provider.current;
    if (!ready || !map) return;
    const click = (e: { markerId: string }) => onSelect?.(e.markerId);
    map.on("marker_click", click);
    return () => map.off("marker_click", click);
  }, [ready, onSelect]);
  return (
    <div
      role="region"
      aria-label={`${title} 지도`}
      data-map-status={error ? "error" : ready ? "ready" : "loading"}
      data-latitude={latitude}
      data-longitude={longitude}
      style={{ position: "absolute", inset: 0 }}
    >
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      {!ready && !error && (
        <p role="status" className="map-location-status loading">
          지도를 불러오고 있어요.
        </p>
      )}
      {error && (
        <p role="alert" className="map-location-status error">
          {error}
        </p>
      )}
    </div>
  );
}

export function GooglePointMap(props: PointProps) {
  if (props.mode !== "live")
    return (
      <MockPointMap
        key={`${props.latitude}:${props.longitude}:${props.centerRevision ?? 0}`}
        {...props}
      />
    );
  return <LivePointMap {...props} />;
}
