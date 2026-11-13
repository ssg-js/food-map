"use client";
import type { Place } from "@food-map/registration";
import { GooglePointMap } from "./GooglePointMap";
import { useEffect, useState } from "react";
export function SelectedPlaceMap({
  apiKey,
  selectedPlace,
  points,
  onSelect,
  mode = "mock",
}: {
  apiKey: string;
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
    points?.find((p) => p.location);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const select = (event: Event) => {
      const p = (event as CustomEvent).detail;
      if (p && typeof p.placeId === "string" && typeof p.name === "string") {
        setPlace(p);
        setPosition(null);
        setMessage("");
      }
    };
    window.addEventListener("food-map-place", select);
    return () => window.removeEventListener("food-map-place", select);
  }, []);
  function locate() {
    if (!navigator.geolocation) {
      setMessage("이 브라우저에서 위치 정보를 사용할 수 없어요.");
      return;
    }
    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
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
        setLocating(false);
        setMessage(
          e.code === 1
            ? "위치 권한이 꺼져 있어요. 브라우저 설정에서 위치를 허용해주세요."
            : "현재 위치를 확인하지 못했어요. 다시 시도해주세요.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }
  const q = position
    ? `${position.latitude},${position.longitude}`
    : place
      ? `place_id:${place.placeId}`
      : null;
  const name = position ? "현재 위치" : place?.name;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        background: "#f2f4f6",
      }}
    >
      {(position || place?.location) && (mode === "mock" || apiKey) ? (
        <GooglePointMap
          mode={mode}
          points={(position ? [] : points)?.flatMap((p) =>
            p.location ? [{ id: p.placeId, title: p.name, ...p.location }] : [],
          )}
          onSelect={(id) => {
            const p = points?.find((p) => p.placeId === id);
            if (p) {
              setPosition(null);
              onSelect?.(p);
            }
          }}
          latitude={(position ?? place!.location!).latitude}
          longitude={(position ?? place!.location!).longitude}
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
      {message && (
        <p
          role="status"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 16,
            background: "white",
            padding: 12,
            borderRadius: 12,
          }}
        >
          {message}
        </p>
      )}
      {q && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(position ? q : place!.name)}${place ? `&query_place_id=${encodeURIComponent(place.placeId)}` : ""}`}
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
