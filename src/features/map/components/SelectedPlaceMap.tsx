"use client";
import type { Place, MapViewport } from "@food-map/registration";
import { GooglePointMap } from "./GooglePointMap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
export function SelectedPlaceMap({
  apiKey,
  selectedPlace,
  points,
  onSelect,
  mode = "mock",
  searchMode = false,
  onViewportChange,
  activeId,
  onHover,
  showLocationMessage = true,
}: {
  apiKey: string;
  searchMode?: boolean;
  showLocationMessage?: boolean;
  onViewportChange?: (bounds: MapViewport) => void;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  points?: Place[];
  onSelect?: (p: Place) => void;
  mode?: "mock" | "live";
  selectedPlace?: Place | null;
}) {
  const [eventPlace, setPlace] = useState<{
    placeId: string;
    name: string;
    location?: { latitude: number; longitude: number };
  } | null>(null);
  const place =
    (selectedPlace === undefined ? eventPlace : selectedPlace) ??
    (!searchMode ? points?.find((p) => p.location) : undefined);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [centerRevision, setCenterRevision] = useState(0);
  const requestVersion = useRef(0);
  const placeChosen = useRef(false);
  const [locating, setLocating] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const select = (event: Event) => {
      const p = (event as CustomEvent).detail;
      if (p && typeof p.placeId === "string" && typeof p.name === "string") {
        placeChosen.current = true;
        requestVersion.current++;
        setLocating(false);
        setPlace(p);
        if (!searchMode) setPosition(null);
        setMessage("");
      }
    };
    window.addEventListener("food-map-place", select);
    return () => window.removeEventListener("food-map-place", select);
  }, [searchMode]);
  const locate = useCallback(() => {
    const version = ++requestVersion.current;
    placeChosen.current = false;
    setLocating(true);
    setMessage("현재 위치를 확인하고 있어요.");
    if (!navigator.geolocation) {
      setLocating(false);
      setMessage(
        "이 브라우저에서 위치 정보를 사용할 수 없어 기본 지도를 표시해요.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (requestVersion.current !== version) return;
        setCenterRevision((revision) => revision + 1);
        setUserLocation({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setPlace(null);
        setLocating(false);
        setMessage(
          `현재 위치를 표시했어요. 오차 약 ${Math.round(p.coords.accuracy)}m`,
        );
      },
      (e) => {
        if (requestVersion.current !== version) return;
        setLocating(false);
        setMessage(
          e.code === 1
            ? "위치 권한이 꺼져 있어 기본 지도를 표시해요. 브라우저 설정에서 위치를 허용해주세요."
            : "현재 위치를 확인하지 못해 기본 지도를 표시해요. 다시 시도해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);
  const invalidateLocation = useCallback(() => {
    requestVersion.current++;
  }, []);
  useEffect(() => {
    // Cancel Strict Mode's first scheduled request and ignore callbacks after unmount.
    const timer = setTimeout(() => {
      if (!placeChosen.current) locate();
    }, 0);
    return () => {
      clearTimeout(timer);
      invalidateLocation();
    };
  }, [locate, invalidateLocation]);
  const center = position ??
    (!searchMode ? place?.location : undefined) ?? {
      latitude: 37.5665,
      longitude: 126.978,
    };
  const mapPoints = useMemo(
    () =>
      (!searchMode && position ? [] : points)?.flatMap((p) =>
        p.location ? [{ id: p.placeId, title: p.name, ...p.location }] : [],
      ),
    [points, position, searchMode],
  );
  const q = position
    ? `${position.latitude},${position.longitude}`
    : place
      ? `place_id:${place.placeId}`
      : null;
  const name =
    searchMode && place?.name
      ? place.name
      : position
        ? "현재 위치"
        : (place?.name ?? "기본 지도 · 서울시청");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        background: "#f2f4f6",
      }}
    >
      {mode === "mock" || apiKey ? (
        <GooglePointMap
          mode={mode}
          userLocation={userLocation}
          centerRevision={centerRevision}
          showMarker={!!(position || place?.location)}
          points={mapPoints}
          onViewportChange={onViewportChange}
          activeId={activeId}
          onHover={onHover}
          fitToPoints={!searchMode}
          onSelect={(id) => {
            const p = points?.find((p) => p.placeId === id);
            if (p) {
              placeChosen.current = true;
              requestVersion.current++;
              setLocating(false);
              setMessage("");
              if (!searchMode) setPosition(null);
              onSelect?.(p);
            }
          }}
          latitude={center.latitude}
          longitude={center.longitude}
          title={name ?? "선택 장소"}
        />
      ) : (
        <div className="placeholder-caption">
          {q
            ? !apiKey
              ? "지도 연결 설정을 확인해주세요."
              : "위치를 확인하지 못했어요. Google 지도에서 직접 확인해주세요."
            : "현재 위치를 확인하거나 검색 결과에서 장소를 선택해주세요."}
        </div>
      )}
      <button
        type="button"
        className="button button-primary"
        disabled={locating}
        onClick={locate}
        style={{ position: "absolute", right: 16, bottom: 24 }}
      >
        {locating ? "위치 확인 중…" : "현재 위치 표시"}
      </button>
      {message && showLocationMessage && (
        <p
          role="status"
          title={message}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: searchMode ? undefined : 16,
            bottom: searchMode ? 74 : undefined,
            background: "white",
            padding: searchMode ? 8 : 12,
            fontSize: searchMode ? 12 : undefined,
            lineHeight: searchMode ? "18px" : undefined,
            whiteSpace: searchMode ? "nowrap" : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderRadius: 12,
          }}
        >
          {message}
        </p>
      )}
      {q && !searchMode && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(position ? q : place!.name)}${!position && place ? `&query_place_id=${encodeURIComponent(place.placeId)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute",
            bottom: 84,
            left: 16,
            background: "white",
            padding: 12,
            borderRadius: 12,
          }}
        >
          Google 지도에서 보기 ↗
        </a>
      )}
    </div>
  );
}
