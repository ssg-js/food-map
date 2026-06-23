import type { Marker } from "./marker";
import type { IMapProvider } from "./map-provider";
import type {
  Coordinate,
  MapEvent,
  MapEventHandler,
  MapInitOptions,
  MapEventPayload,
} from "./types";

type EventHandlerMap = {
  [K in MapEvent]: Set<MapEventHandler<K>>;
};

/**
 * SDK 연동 전 개발·테스트용 스텁 구현.
 * 실제 지도 렌더링 없이 상태와 이벤트 흐름만 검증한다.
 */
export class StubMapProvider implements IMapProvider {
  private container: HTMLElement | null = null;
  private center: Coordinate = { latitude: 37.5665, longitude: 126.978 };
  private zoom = 13;
  private markers: Map<string, Marker> = new Map();
  private handlers: EventHandlerMap = {
    center_changed: new Set(),
    zoom_changed: new Set(),
    click: new Set(),
    marker_click: new Set(),
  };

  initialize(container: HTMLElement, options: MapInitOptions): void {
    this.container = container;
    this.center = options.center;
    this.zoom = options.zoom;
    container.dataset.mapProvider = "stub";
    container.style.background =
      "linear-gradient(135deg, #e4e4e7 25%, #d4d4d8 25%, #d4d4d8 50%, #e4e4e7 50%, #e4e4e7 75%, #d4d4d8 75%)";
    container.style.backgroundSize = "40px 40px";
  }

  destroy(): void {
    this.container = null;
    this.markers.clear();
    for (const event of Object.keys(this.handlers) as MapEvent[]) {
      this.handlers[event].clear();
    }
  }

  isInitialized(): boolean {
    return this.container !== null;
  }

  setCenter(center: Coordinate): void {
    this.center = center;
    this.emit("center_changed", center);
  }

  getCenter(): Coordinate {
    return { ...this.center };
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.emit("zoom_changed", zoom);
  }

  getZoom(): number {
    return this.zoom;
  }

  panTo(center: Coordinate): void {
    this.setCenter(center);
  }

  addMarker(marker: Marker): void {
    this.markers.set(marker.id, marker);
  }

  updateMarker(marker: Marker): void {
    this.markers.set(marker.id, marker);
  }

  removeMarker(markerId: string): void {
    this.markers.delete(markerId);
  }

  clearMarkers(): void {
    this.markers.clear();
  }

  getMarkers(): Marker[] {
    return Array.from(this.markers.values());
  }

  on<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void {
    this.handlers[event].add(handler);
  }

  off<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void {
    this.handlers[event].delete(handler);
  }

  private emit<T extends MapEvent>(event: T, payload: MapEventPayload[T]): void {
    for (const handler of this.handlers[event]) {
      handler(payload);
    }
  }
}

export function createStubMapProvider(): IMapProvider {
  return new StubMapProvider();
}
