export interface MapViewport {
  south: number;
  west: number;
  north: number;
  east: number;
}
export interface MapCoordinate {
  latitude: number;
  longitude: number;
}
export function validViewport(value: unknown): value is MapViewport {
  if (!value || typeof value !== "object") return false;
  const v = value as MapViewport;
  return (
    [v.south, v.west, v.north, v.east].every(
      (n) => typeof n === "number" && Number.isFinite(n),
    ) &&
    v.south >= -90 &&
    v.north <= 90 &&
    v.south < v.north &&
    v.west >= -180 &&
    v.west <= 180 &&
    v.east >= -180 &&
    v.east <= 180 &&
    v.west !== v.east &&
    !(v.west === 180 && v.east === -180)
  );
}
export function inViewport(
  point: unknown,
  v: MapViewport,
): point is MapCoordinate {
  if (!point || typeof point !== "object") return false;
  const p = point as MapCoordinate;
  return (
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.longitude) <= 180 &&
    p.latitude >= v.south &&
    p.latitude <= v.north &&
    (v.west <= v.east
      ? p.longitude >= v.west && p.longitude <= v.east
      : p.longitude >= v.west || p.longitude <= v.east)
  );
}
export const viewportKey = (v: MapViewport) =>
  [v.south, v.west, v.north, v.east].map((n) => n.toFixed(5)).join(",");
export const wrapLongitude = (n: number) =>
  ((((n + 180) % 360) + 360) % 360) - 180;
export function viewportFromCenter(
  p: MapCoordinate,
  zoom: number,
  width: number,
  height: number,
): MapViewport {
  const size = 256 * 2 ** zoom,
    lat = Math.max(-85, Math.min(85, p.latitude));
  const sin = Math.sin((lat * Math.PI) / 180),
    y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  const latitude = (py: number) =>
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / size))) * 180) / Math.PI;
  return {
    south: Math.max(-85, latitude(y + height / 2)),
    north: Math.min(85, latitude(y - height / 2)),
    west:
      width >= size ? -180 : wrapLongitude(p.longitude - (width / size) * 180),
    east:
      width >= size ? 180 : wrapLongitude(p.longitude + (width / size) * 180),
  };
}
export function viewportCenter(v: MapViewport): MapCoordinate {
  return {
    latitude: (v.north + v.south) / 2,
    longitude: wrapLongitude(
      v.west + ((v.east - v.west + 360) % 360 || 360) / 2,
    ),
  };
}
