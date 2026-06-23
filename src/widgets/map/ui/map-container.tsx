"use client";

import { useEffect, useRef, useState } from "react";

import { useMapStore } from "@/shared/store/map-store";

import { useMapContext } from "../model/map-context";
import type { Marker } from "../model/marker";
import type { Coordinate, MarkerClickEvent } from "../model/types";

interface MapContainerProps {
  className?: string;
  markers?: Marker[];
  onMapClick?: (coordinate: Coordinate) => void;
  onMapError?: (error: Error) => void;
  onMapReady?: () => void;
  onMarkerClick?: (event: MarkerClickEvent) => void;
}

export function MapContainer({
  className,
  markers = [],
  onMapClick,
  onMapError,
  onMapReady,
  onMarkerClick,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const provider = useMapContext();
  const { latitude, longitude, zoom, setCenter, setZoom } = useMapStore();
  const isInitializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isActive = true;
    const container = containerRef.current;
    if (!container || isInitializedRef.current) return;

    const { latitude, longitude, zoom: initialZoom } = useMapStore.getState();

    void Promise.resolve(
      provider.initialize(container, {
        center: { latitude, longitude },
        zoom: initialZoom,
      }),
    ).then(() => {
      if (!isActive) {
        provider.destroy();
        return;
      }

      const {
        latitude: latestLatitude,
        longitude: latestLongitude,
        zoom: latestZoom,
      } = useMapStore.getState();

      provider.setCenter({
        latitude: latestLatitude,
        longitude: latestLongitude,
      });
      provider.setZoom(latestZoom);
      isInitializedRef.current = true;
      setIsInitialized(true);
      onMapReady?.();
    }).catch((error: unknown) => {
      if (!isActive) return;

      onMapError?.(
        error instanceof Error
          ? error
          : new Error("지도를 초기화하지 못했습니다."),
      );
    });

    const handleCenterChanged = (center: Coordinate) => {
      setCenter(center.latitude, center.longitude);
    };

    const handleZoomChanged = (nextZoom: number) => {
      setZoom(nextZoom);
    };

    provider.on("center_changed", handleCenterChanged);
    provider.on("zoom_changed", handleZoomChanged);

    return () => {
      isActive = false;
      provider.off("center_changed", handleCenterChanged);
      provider.off("zoom_changed", handleZoomChanged);
      provider.destroy();
      isInitializedRef.current = false;
      setIsInitialized(false);
    };
  }, [onMapError, onMapReady, provider, setCenter, setZoom]);

  useEffect(() => {
    if (!isInitialized || !provider.isInitialized()) return;

    const currentCenter = provider.getCenter();
    if (
      currentCenter.latitude !== latitude ||
      currentCenter.longitude !== longitude
    ) {
      provider.setCenter({ latitude, longitude });
    }
  }, [isInitialized, latitude, longitude, provider]);

  useEffect(() => {
    if (!isInitialized || !provider.isInitialized()) return;

    if (provider.getZoom() !== zoom) {
      provider.setZoom(zoom);
    }
  }, [isInitialized, zoom, provider]);

  useEffect(() => {
    if (!isInitialized || !provider.isInitialized()) return;

    provider.clearMarkers();
    for (const marker of markers) {
      provider.addMarker(marker);
    }
  }, [isInitialized, markers, provider]);

  useEffect(() => {
    if (!isInitialized || !provider.isInitialized() || !onMapClick) return;

    const handleClick = (event: { coordinate: Coordinate }) => {
      onMapClick(event.coordinate);
    };

    provider.on("click", handleClick);
    return () => provider.off("click", handleClick);
  }, [isInitialized, onMapClick, provider]);

  useEffect(() => {
    if (!isInitialized || !provider.isInitialized() || !onMarkerClick) return;

    provider.on("marker_click", onMarkerClick);
    return () => provider.off("marker_click", onMarkerClick);
  }, [isInitialized, onMarkerClick, provider]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label="지도"
    />
  );
}
