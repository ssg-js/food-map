export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  southwest: Coordinate;
  northeast: Coordinate;
}

export interface MapInitOptions {
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

export type MapEvent = "center_changed" | "zoom_changed" | "click" | "marker_click";

export interface MapClickEvent {
  coordinate: Coordinate;
}

export interface MarkerClickEvent {
  markerId: string;
  coordinate: Coordinate;
}

export type MapEventPayload = {
  center_changed: Coordinate;
  zoom_changed: number;
  click: MapClickEvent;
  marker_click: MarkerClickEvent;
};

export type MapEventHandler<T extends MapEvent = MapEvent> = (
  payload: MapEventPayload[T],
) => void;
