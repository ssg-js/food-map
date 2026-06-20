"use client";

import { useEffect, useRef, useState } from "react";

import { useMapStore } from "@/shared/store/map-store";
import { MapContainer } from "@/widgets/map";

import { useContainerSize } from "../hooks/useContainerSize";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { MOCK_RESTAURANTS } from "../model/mockRestaurants";
import { RestaurantBottomSheet } from "./RestaurantBottomSheet";
import { RestaurantMarker } from "./RestaurantMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import type { MapRestaurant } from "../model/types";

function LocationStatusBanner({
  message,
  variant,
}: {
  message: string;
  variant: "loading" | "warning" | "error";
}) {
  const styles = {
    loading: "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    warning:
      "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    error: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  };

  return (
    <div
      className={`absolute left-4 right-4 top-4 z-50 rounded-lg px-4 py-2 text-sm shadow-md ${styles[variant]}`}
      role="status"
    >
      {message}
    </div>
  );
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useContainerSize(containerRef);
  const { status, position, errorMessage } = useCurrentLocation();
  const { latitude, longitude, zoom, setCenter } = useMapStore();
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<MapRestaurant | null>(null);

  useEffect(() => {
    if (!position) return;
    setCenter(position.latitude, position.longitude);
  }, [position, setCenter]);

  const center = { latitude, longitude };
  const isMapReady = containerSize.width > 0 && containerSize.height > 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
      <MapContainer
        className="absolute inset-0 h-full w-full bg-zinc-200 dark:bg-zinc-800"
      />

      {isMapReady &&
        MOCK_RESTAURANTS.map((restaurant) => (
          <RestaurantMarker
            key={restaurant.id}
            restaurant={restaurant}
            center={center}
            zoom={zoom}
            containerSize={containerSize}
            isSelected={selectedRestaurant?.id === restaurant.id}
            onSelect={setSelectedRestaurant}
          />
        ))}

      {isMapReady && position && status === "success" && (
        <UserLocationMarker
          coordinate={position}
          center={center}
          zoom={zoom}
          containerSize={containerSize}
        />
      )}

      {status === "idle" && (
        <LocationStatusBanner
          variant="loading"
          message="현재 위치를 확인하는 중입니다..."
        />
      )}

      {status === "denied" && errorMessage && (
        <LocationStatusBanner variant="warning" message={errorMessage} />
      )}

      {status === "error" && errorMessage && (
        <LocationStatusBanner variant="error" message={errorMessage} />
      )}

      <RestaurantBottomSheet
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
      />
    </div>
  );
}
