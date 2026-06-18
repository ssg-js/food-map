import type { Coordinate } from "./types";

export interface Marker {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
}
