"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMapStore } from "@/shared/store/map-store";
import { MapContainer, type Marker, type MarkerClickEvent } from "@/widgets/map";

import { useContainerSize } from "../hooks/useContainerSize";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useRestaurants } from "../hooks/useRestaurants";
import { MapEmptyState } from "./MapEmptyState";
import { MapSearchControls } from "./MapSearchControls";
import { RestaurantBottomSheet } from "./RestaurantBottomSheet";
import { UserLocationMarker } from "./UserLocationMarker";
import {
  filterRestaurants,
  getRestaurantCategories,
  hasActiveRestaurantFilter,
  type RestaurantFilterState,
} from "../model/restaurant-filter";

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
      className={`absolute left-4 right-4 top-44 z-50 rounded-lg px-4 py-2 text-sm shadow-md ${styles[variant]}`}
      role="status"
    >
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
  const {
    data: restaurants = [],
    error: restaurantsError,
    isError: isRestaurantsError,
    isPending: isRestaurantsPending,
  } = useRestaurants();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [mapLoadStatus, setMapLoadStatus] =
    useState<MapLoadStatus>("loading");
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<RestaurantFilterState>({
    searchTerm: "",
    selectedCategory: null,
  });
  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filter),
    [filter, restaurants],
  );
  const categories = useMemo(
    () => getRestaurantCategories(restaurants),
    [restaurants],
  );
  const hasActiveFilter = hasActiveRestaurantFilter(filter);
  const markers = useMemo<Marker[]>(
    () =>
      filteredRestaurants.map((restaurant) => ({
        id: restaurant.id,
        coordinate: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        },
        title: restaurant.name,
        description: restaurant.description,
      })),
    [filteredRestaurants],
  );
  const selectedRestaurant = useMemo(
    () =>
      filteredRestaurants.find(
        (restaurant) => restaurant.id === selectedRestaurantId,
      ) ?? null,
    [filteredRestaurants, selectedRestaurantId],
  );

  const handleMarkerClick = useCallback((event: MarkerClickEvent) => {
    setSelectedRestaurantId(event.markerId);
  }, []);

  const updateFilter = useCallback(
    (nextFilter: RestaurantFilterState) => {
      setFilter(nextFilter);

      if (!selectedRestaurantId) return;

      const isSelectedRestaurantVisible = filterRestaurants(
        restaurants,
        nextFilter,
      ).some((restaurant) => restaurant.id === selectedRestaurantId);

      if (!isSelectedRestaurantVisible) {
        setSelectedRestaurantId(null);
      }
    },
    [restaurants, selectedRestaurantId],
  );

  const handleSearchTermChange = useCallback(
    (searchTerm: string) => {
      updateFilter({ ...filter, searchTerm });
    },
    [filter, updateFilter],
  );

  const handleCategoryChange = useCallback(
    (selectedCategory: string | null) => {
      updateFilter({ ...filter, selectedCategory });
    },
    [filter, updateFilter],
  );

  const handleResetFilter = useCallback(() => {
    updateFilter({
      searchTerm: "",
      selectedCategory: null,
    });
  }, [updateFilter]);

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
  const showEmptyState =
    !isRestaurantsPending &&
    !isRestaurantsError &&
    restaurants.length > 0 &&
    filteredRestaurants.length === 0;
  const statusBanner = useMemo(() => {
    if (mapLoadStatus === "error") {
      return {
        variant: "error" as const,
        message:
          mapErrorMessage ??
          "지도를 불러오지 못했습니다. API key 또는 네트워크 상태를 확인해주세요.",
      };
    }

    if (isRestaurantsError) {
      return {
        variant: "error" as const,
        message: restaurantsError.message,
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

    if (isRestaurantsPending) {
      return {
        variant: "loading" as const,
        message: "맛집 목록을 불러오는 중입니다...",
      };
    }

    if (status === "requesting" || status === "idle") {
      return {
        variant: "loading" as const,
        message: "현재 위치를 확인하는 중입니다...",
      };
    }

    return null;
  }, [
    errorMessage,
    isRestaurantsError,
    isRestaurantsPending,
    mapErrorMessage,
    mapLoadStatus,
    restaurantsError,
    status,
  ]);

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
      <MapContainer
        className="absolute inset-0 h-full w-full bg-zinc-200 dark:bg-zinc-800"
        markers={markers}
        onMapError={handleMapError}
        onMapReady={handleMapReady}
        onMarkerClick={handleMarkerClick}
      />

      <MapSearchControls
        categories={categories}
        hasActiveFilter={hasActiveFilter}
        resultCount={filteredRestaurants.length}
        searchTerm={filter.searchTerm}
        selectedCategory={filter.selectedCategory}
        totalCount={restaurants.length}
        onCategoryChange={handleCategoryChange}
        onReset={handleResetFilter}
        onSearchTermChange={handleSearchTermChange}
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

      {showEmptyState && <MapEmptyState onReset={handleResetFilter} />}

      <RestaurantBottomSheet
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurantId(null)}
      />
    </div>
  );
}
