import type { Place } from "./api";
import {
  validViewport,
  type MapCoordinate,
  type MapViewport,
} from "./viewport";
export interface SearchMapState {
  type: "map-state";
  center: MapCoordinate;
  title: string;
  points: Place[];
  activeId: string | null;
}
export type SearchMapEvent =
  | { type: "map-ready" }
  | { type: "viewport"; bounds: MapViewport }
  | { type: "select" | "hover"; id: string | null };
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}
export function readMapState(value: unknown): SearchMapState | null {
  if (
    !object(value) ||
    value.type !== "map-state" ||
    !object(value.center) ||
    typeof value.center.latitude !== "number" ||
    typeof value.center.longitude !== "number" ||
    !Number.isFinite(value.center.latitude) ||
    !Number.isFinite(value.center.longitude) ||
    Math.abs(value.center.latitude) > 90 ||
    Math.abs(value.center.longitude) > 180 ||
    typeof value.title !== "string" ||
    value.title.length > 300 ||
    !Array.isArray(value.points) ||
    value.points.length > 12 ||
    !(
      value.activeId === null ||
      (typeof value.activeId === "string" && value.activeId.length <= 512)
    )
  )
    return null;
  if (
    !value.points.every(
      (p) =>
        object(p) &&
        typeof p.placeId === "string" &&
        p.placeId.length <= 512 &&
        typeof p.name === "string" &&
        p.name.length <= 300 &&
        typeof p.address === "string" &&
        p.address.length <= 1000 &&
        (!p.location ||
          (object(p.location) &&
            typeof p.location.latitude === "number" &&
            typeof p.location.longitude === "number" &&
            Number.isFinite(p.location.latitude) &&
            Number.isFinite(p.location.longitude) &&
            Math.abs(p.location.latitude) <= 90 &&
            Math.abs(p.location.longitude) <= 180)),
    )
  )
    return null;
  return value as unknown as SearchMapState;
}
export function readMapEvent(value: unknown): SearchMapEvent | null {
  if (!object(value)) return null;
  if (value.type === "map-ready") return { type: "map-ready" };
  if (value.type === "viewport" && validViewport(value.bounds))
    return { type: "viewport", bounds: value.bounds };
  if (
    (value.type === "select" || value.type === "hover") &&
    (value.id === null ||
      (typeof value.id === "string" && value.id.length <= 512))
  )
    return { type: value.type, id: value.id };
  return null;
}
