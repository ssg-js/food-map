import { MAP_TILE_SIZE } from "@/shared/constants/map";
import type { Coordinate, ContainerSize } from "@/shared/types/coordinate";

interface PixelPosition {
  left: number;
  top: number;
}

function projectToWorldPixels(coordinate: Coordinate, zoom: number): {
  x: number;
  y: number;
} {
  const scale = MAP_TILE_SIZE * Math.pow(2, zoom);
  const x = ((coordinate.longitude + 180) / 360) * scale;
  const sinLatitude = Math.sin((coordinate.latitude * Math.PI) / 180);
  const y =
    (0.5 -
      Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    scale;

  return { x, y };
}

export function projectCoordinateToPixel(
  coordinate: Coordinate,
  center: Coordinate,
  zoom: number,
  containerSize: ContainerSize,
): PixelPosition {
  const centerPixels = projectToWorldPixels(center, zoom);
  const targetPixels = projectToWorldPixels(coordinate, zoom);

  return {
    left: containerSize.width / 2 + (targetPixels.x - centerPixels.x),
    top: containerSize.height / 2 + (targetPixels.y - centerPixels.y),
  };
}
