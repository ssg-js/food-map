"use client";

import { useEffect, useRef } from "react";

import { useMapStore } from "@/shared/store/map-store";

import { useMapContext } from "../model/map-context";
import type { Marker } from "../model/marker";
import type { Coordinate, MarkerClickEvent } from "../model/types";

interface MapContainerProps {
  className?: string;
  markers?: Marker[];
  onMapClick?: (coordinate: Coordinate) => void;
  onMarkerClick?: (event: MarkerClickEvent) => void;
}

export function MapContainer({
  className,
  markers = [],
  onMapClick,
  onMarkerClick,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const provider = useMapContext();
  const { latitude, longitude, zoom, setCenter, setZoom } = useMapStore();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isInitializedRef.current) return;

    const { latitude, longitude, zoom: initialZoom } = useMapStore.getState();

    provider.initialize(container, {
      center: { latitude, longitude },
      zoom: initialZoom,
    });
    isInitializedRef.current = true;

    const handleCenterChanged = (center: Coordinate) => {
      setCenter(center.latitude, center.longitude);
    };

    const handleZoomChanged = (nextZoom: number) => {
      setZoom(nextZoom);
    };

    provider.on("center_changed", handleCenterChanged);
    provider.on("zoom_changed", handleZoomChanged);

    return () => {
      provider.off("center_changed", handleCenterChanged);
      provider.off("zoom_changed", handleZoomChanged);
      provider.destroy();
      isInitializedRef.current = false;
    };
  }, [provider, setCenter, setZoom]);

  useEffect(() => {
    if (!provider.isInitialized()) return;

    const currentCenter = provider.getCenter();
    if (
      currentCenter.latitude !== latitude ||
      currentCenter.longitude !== longitude
    ) {
      provider.setCenter({ latitude, longitude });
    }
  }, [latitude, longitude, provider]);

  useEffect(() => {
    if (!provider.isInitialized()) return;

    if (provider.getZoom() !== zoom) {
      provider.setZoom(zoom);
    }
  }, [zoom, provider]);

  useEffect(() => {
    if (!provider.isInitialized()) return;

    provider.clearMarkers();
    for (const marker of markers) {
      provider.addMarker(marker);
    }
  }, [markers, provider]);

  useEffect(() => {
    if (!provider.isInitialized() || !onMapClick) return;

    const handleClick = (event: { coordinate: Coordinate }) => {
      onMapClick(event.coordinate);
    };

    provider.on("click", handleClick);
    return () => provider.off("click", handleClick);
  }, [onMapClick, provider]);

  useEffect(() => {
    if (!provider.isInitialized() || !onMarkerClick) return;

    provider.on("marker_click", onMarkerClick);
    return () => provider.off("marker_click", onMarkerClick);
  }, [onMarkerClick, provider]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label="지도"
    />
  );
}
