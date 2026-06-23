import type { MapRestaurant } from "../model/types";
import { projectCoordinateToPixel } from "../lib/project-coordinate";
import type { Coordinate, ContainerSize } from "@/shared/types/coordinate";

interface RestaurantMarkerProps {
  restaurant: MapRestaurant;
  center: Coordinate;
  zoom: number;
  containerSize: ContainerSize;
  isSelected: boolean;
  onSelect: (restaurant: MapRestaurant) => void;
}

export function RestaurantMarker({
  restaurant,
  center,
  zoom,
  containerSize,
  isSelected,
  onSelect,
}: RestaurantMarkerProps) {
  const coordinate: Coordinate = {
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  };

  const { left, top } = projectCoordinateToPixel(
    coordinate,
    center,
    zoom,
    containerSize,
  );

  return (
    <button
      type="button"
      className={`absolute z-10 flex size-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 shadow-md transition-transform hover:scale-110 ${
        isSelected
          ? "border-white bg-orange-500 scale-110"
          : "border-white bg-red-500"
      }`}
      style={{ left, top }}
      aria-label={`${restaurant.name} 마커`}
      aria-pressed={isSelected}
      onClick={() => onSelect(restaurant)}
    >
      <span className="text-xs font-bold text-white" aria-hidden="true">
        ★
      </span>
    </button>
  );
}
