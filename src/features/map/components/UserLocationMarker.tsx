import { projectCoordinateToPixel } from "../lib/project-coordinate";
import type { Coordinate, ContainerSize } from "@/shared/types/coordinate";

interface UserLocationMarkerProps {
  coordinate: Coordinate;
  center: Coordinate;
  zoom: number;
  containerSize: ContainerSize;
}

export function UserLocationMarker({
  coordinate,
  center,
  zoom,
  containerSize,
}: UserLocationMarkerProps) {
  const { left, top } = projectCoordinateToPixel(
    coordinate,
    center,
    zoom,
    containerSize,
  );

  return (
    <div
      className="absolute z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-md"
      style={{ left, top }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-40" />
    </div>
  );
}
