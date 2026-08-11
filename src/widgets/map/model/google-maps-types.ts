import type { Coordinate, MapBounds } from "./types";

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  disableDefaultUI?: boolean;
  clickableIcons?: boolean;
}

export interface GoogleMapsEventListener {
  remove(): void;
}

export interface GoogleMapMouseEvent {
  latLng: {
    lat(): number;
    lng(): number;
  } | null;
}

export interface GoogleMap {
  setCenter(center: GoogleLatLngLiteral): void;
  getCenter(): {
    lat(): number;
    lng(): number;
  } | null;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  getBounds(): {
    getNorthEast(): {
      lat(): number;
      lng(): number;
    };
    getSouthWest(): {
      lat(): number;
      lng(): number;
    };
  } | null;
  panTo(center: GoogleLatLngLiteral): void;
}

export interface GoogleMarker {
  setMap(map: GoogleMap | null): void;
  setPosition(position: GoogleLatLngLiteral): void;
  setTitle(title: string): void;
  addListener(
    eventName: "click",
    handler: () => void,
  ): GoogleMapsEventListener;
}

export interface GoogleMapsApi {
  Map: new (container: HTMLElement, options: GoogleMapOptions) => GoogleMap;
  Marker: new (options: {
    map: GoogleMap;
    position: GoogleLatLngLiteral;
    title?: string;
  }) => GoogleMarker;
  event: {
    addListener(
      target: GoogleMap,
      eventName: "center_changed" | "zoom_changed" | "idle",
      handler: () => void,
    ): GoogleMapsEventListener;
    addListener(
      target: GoogleMap,
      eventName: "click",
      handler: (event: GoogleMapMouseEvent) => void,
    ): GoogleMapsEventListener;
  };
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsApi;
    };
  }
}

export function toGoogleLatLng(coordinate: Coordinate): GoogleLatLngLiteral {
  return {
    lat: coordinate.latitude,
    lng: coordinate.longitude,
  };
}

export function fromGoogleLatLng(latLng: {
  lat(): number;
  lng(): number;
}): Coordinate {
  return {
    latitude: latLng.lat(),
    longitude: latLng.lng(),
  };
}

export function fromGoogleLatLngBounds(bounds: {
  getNorthEast(): {
    lat(): number;
    lng(): number;
  };
  getSouthWest(): {
    lat(): number;
    lng(): number;
  };
}): MapBounds {
  return {
    northeast: fromGoogleLatLng(bounds.getNorthEast()),
    southwest: fromGoogleLatLng(bounds.getSouthWest()),
  };
}
