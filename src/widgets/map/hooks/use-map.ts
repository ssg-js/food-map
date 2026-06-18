"use client";

import { useCallback } from "react";

import { useMapStore } from "@/shared/store/map-store";

import { useMapContext } from "../model/map-context";
import type { Marker } from "../model/marker";
import type { Coordinate } from "../model/types";

export function useMap() {
  const provider = useMapContext();
  const { latitude, longitude, zoom, setCenter, setZoom } = useMapStore();

  const center: Coordinate = { latitude, longitude };

  const updateCenter = useCallback(
    (nextCenter: Coordinate) => {
      provider.setCenter(nextCenter);
      setCenter(nextCenter.latitude, nextCenter.longitude);
    },
    [provider, setCenter],
  );

  const updateZoom = useCallback(
    (nextZoom: number) => {
      provider.setZoom(nextZoom);
      setZoom(nextZoom);
    },
    [provider, setZoom],
  );

  const panTo = useCallback(
    (nextCenter: Coordinate) => {
      provider.panTo(nextCenter);
      setCenter(nextCenter.latitude, nextCenter.longitude);
    },
    [provider, setCenter],
  );

  const addMarker = useCallback(
    (marker: Marker) => {
      provider.addMarker(marker);
    },
    [provider],
  );

  const removeMarker = useCallback(
    (markerId: string) => {
      provider.removeMarker(markerId);
    },
    [provider],
  );

  const clearMarkers = useCallback(() => {
    provider.clearMarkers();
  }, [provider]);

  return {
    provider,
    center,
    zoom,
    setCenter: updateCenter,
    setZoom: updateZoom,
    panTo,
    addMarker,
    removeMarker,
    clearMarkers,
    getMarkers: provider.getMarkers,
    isInitialized: provider.isInitialized,
  };
}
