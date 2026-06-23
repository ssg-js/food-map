import { loadGoogleMaps } from "../lib/load-google-maps";
import type { Marker } from "./marker";
import type { IMapProvider } from "./map-provider";
import type {
  GoogleMap,
  GoogleMapsApi,
  GoogleMapsEventListener,
  GoogleMarker,
} from "./google-maps-types";
import {
  fromGoogleLatLng,
  toGoogleLatLng,
} from "./google-maps-types";
import type {
  Coordinate,
  MapEvent,
  MapEventHandler,
  MapEventPayload,
  MapInitOptions,
} from "./types";

type EventHandlerMap = {
  [K in MapEvent]: Set<MapEventHandler<K>>;
};

interface GoogleMarkerEntry {
  marker: Marker;
  googleMarker: GoogleMarker;
  listeners: GoogleMapsEventListener[];
}

export class GoogleMapProvider implements IMapProvider {
  private googleMaps: GoogleMapsApi | null = null;
  private map: GoogleMap | null = null;
  private center: Coordinate = { latitude: 37.5665, longitude: 126.978 };
  private zoom = 13;
  private markers: Map<string, GoogleMarkerEntry> = new Map();
  private mapListeners: GoogleMapsEventListener[] = [];
  private handlers: EventHandlerMap = {
    center_changed: new Set(),
    zoom_changed: new Set(),
    click: new Set(),
    marker_click: new Set(),
  };

  async initialize(
    container: HTMLElement,
    options: MapInitOptions,
  ): Promise<void> {
    this.googleMaps = await loadGoogleMaps();
    this.center = options.center;
    this.zoom = options.zoom;

    this.map = new this.googleMaps.Map(container, {
      center: toGoogleLatLng(options.center),
      zoom: options.zoom,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      clickableIcons: false,
      disableDefaultUI: true,
    });

    this.bindMapEvents();
  }

  destroy(): void {
    this.clearMarkers();

    for (const listener of this.mapListeners) {
      listener.remove();
    }

    this.mapListeners = [];
    this.map = null;
    this.googleMaps = null;
  }

  isInitialized(): boolean {
    return this.map !== null && this.googleMaps !== null;
  }

  setCenter(center: Coordinate): void {
    this.center = center;
    this.map?.setCenter(toGoogleLatLng(center));
  }

  getCenter(): Coordinate {
    const mapCenter = this.map?.getCenter();

    if (!mapCenter) {
      return { ...this.center };
    }

    return fromGoogleLatLng(mapCenter);
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.map?.setZoom(zoom);
  }

  getZoom(): number {
    return this.map?.getZoom() ?? this.zoom;
  }

  panTo(center: Coordinate): void {
    this.center = center;
    this.map?.panTo(toGoogleLatLng(center));
  }

  addMarker(marker: Marker): void {
    if (!this.map || !this.googleMaps) return;

    const googleMarker = new this.googleMaps.Marker({
      map: this.map,
      position: toGoogleLatLng(marker.coordinate),
      title: marker.title,
    });

    const listeners = [
      googleMarker.addListener("click", () => {
        this.emit("marker_click", {
          markerId: marker.id,
          coordinate: marker.coordinate,
        });
      }),
    ];

    this.markers.set(marker.id, {
      marker,
      googleMarker,
      listeners,
    });
  }

  updateMarker(marker: Marker): void {
    const markerEntry = this.markers.get(marker.id);

    if (!markerEntry) {
      this.addMarker(marker);
      return;
    }

    markerEntry.marker = marker;
    markerEntry.googleMarker.setPosition(toGoogleLatLng(marker.coordinate));
    markerEntry.googleMarker.setTitle(marker.title ?? "");
  }

  removeMarker(markerId: string): void {
    const markerEntry = this.markers.get(markerId);

    if (!markerEntry) return;

    for (const listener of markerEntry.listeners) {
      listener.remove();
    }

    markerEntry.googleMarker.setMap(null);
    this.markers.delete(markerId);
  }

  clearMarkers(): void {
    for (const markerId of this.markers.keys()) {
      this.removeMarker(markerId);
    }
  }

  getMarkers(): Marker[] {
    return Array.from(this.markers.values(), ({ marker }) => marker);
  }

  on<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void {
    this.handlers[event].add(handler);
  }

  off<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void {
    this.handlers[event].delete(handler);
  }

  private bindMapEvents(): void {
    if (!this.map || !this.googleMaps) return;

    this.mapListeners = [
      this.googleMaps.event.addListener(this.map, "center_changed", () => {
        const center = this.getCenter();
        this.center = center;
        this.emit("center_changed", center);
      }),
      this.googleMaps.event.addListener(this.map, "zoom_changed", () => {
        const zoom = this.getZoom();
        this.zoom = zoom;
        this.emit("zoom_changed", zoom);
      }),
      this.googleMaps.event.addListener(this.map, "click", (event) => {
        if (!event.latLng) return;

        this.emit("click", {
          coordinate: fromGoogleLatLng(event.latLng),
        });
      }),
    ];
  }

  private emit<T extends MapEvent>(event: T, payload: MapEventPayload[T]): void {
    for (const handler of this.handlers[event]) {
      handler(payload);
    }
  }
}

export function createGoogleMapProvider(): IMapProvider {
  return new GoogleMapProvider();
}
