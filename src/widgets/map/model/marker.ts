import type { Coordinate } from "./types";

export interface Marker {
  id: string;
  kind?: "place" | "user-location" | "user-location-halo";
  coordinate: Coordinate;
  title?: string;
  description?: string;
}
