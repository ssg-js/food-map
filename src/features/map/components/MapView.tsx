"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMapStore } from "@/shared/store/map-store";
import { MapContainer } from "@/widgets/map";

import { useContainerSize } from "../hooks/useContainerSize";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { MapCurrentLocationButton } from "./MapCurrentLocationButton";
import { UserLocationMarker } from "./UserLocationMarker";

function LocationStatusBanner({
  message,
  variant,
}: {
  message: string;
  variant: "loading" | "warning" | "error";
}) {
  return (
    <div className={`map-location-status ${variant}`} role="status">
      {message}
    </div>
  );
}

type MapLoadStatus = "loading" | "ready" | "error";

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useContainerSize(containerRef);
  const { status, position, errorMessage } = useCurrentLocation();
  const { latitude, longitude, zoom, setCenter } = useMapStore();
  const [mapLoadStatus, setMapLoadStatus] = useState<MapLoadStatus>("loading");
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);

  const handleMoveToCurrentLocation = useCallback(() => {
    if (!position) return;

    setCenter(position.latitude, position.longitude);
  }, [position, setCenter]);

  const handleMapReady = useCallback(() => {
    setMapLoadStatus("ready");
    setMapErrorMessage(null);
  }, []);

  const handleMapError = useCallback((error: Error) => {
    setMapLoadStatus("error");
    setMapErrorMessage(error.message);
  }, []);

  useEffect(() => {
    if (!position) return;
    setCenter(position.latitude, position.longitude);
  }, [position, setCenter]);

  const center = { latitude, longitude };
  const isMapReady = containerSize.width > 0 && containerSize.height > 0;
  const statusBanner = useMemo(() => {
    if (mapLoadStatus === "error") {
      return {
        variant: "error" as const,
        message:
          mapErrorMessage ??
          "지도를 불러오지 못했어요. 장소 검색과 등록은 계속할 수 있어요.",
      };
    }

    if (status === "error" && errorMessage) {
      return {
        variant: "error" as const,
        message: errorMessage,
      };
    }

    if (status === "denied" && errorMessage) {
      return {
        variant: "warning" as const,
        message: errorMessage,
      };
    }

    if (mapLoadStatus === "loading") {
      return {
        variant: "loading" as const,
        message: "지도를 불러오는 중입니다...",
      };
    }

    if (status === "requesting" || status === "idle") {
      return {
        variant: "loading" as const,
        message: "현재 위치를 확인하는 중입니다...",
      };
    }

    return null;
  }, [errorMessage, mapErrorMessage, mapLoadStatus, status]);

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
      <MapContainer
        className="absolute inset-0 h-full w-full bg-zinc-100"
        onMapError={handleMapError}
        onMapReady={handleMapReady}
      />

      {isMapReady && position && status === "success" && (
        <UserLocationMarker
          coordinate={position}
          center={center}
          zoom={zoom}
          containerSize={containerSize}
        />
      )}

      {statusBanner && (
        <LocationStatusBanner
          variant={statusBanner.variant}
          message={statusBanner.message}
        />
      )}

      <MapCurrentLocationButton
        isDisabled={!position || status !== "success"}
        onClick={handleMoveToCurrentLocation}
      />
    </div>
  );
}
