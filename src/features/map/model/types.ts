import type { Restaurant } from "@/entities/restaurant/type/restaurant";
import type { Coordinate } from "@/shared/types/coordinate";

export type MapRestaurant = Restaurant;

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "success"
  | "error"
  | "denied";

export interface GeolocationState {
  status: GeolocationStatus;
  position: Coordinate | null;
  errorMessage: string | null;
}
