import type { Marker } from "./marker";
import type {
  Coordinate,
  MapEvent,
  MapEventHandler,
  MapInitOptions,
} from "./types";

/**
 * 지도 SDK(Kakao, Naver 등)를 교체할 수 있도록 정의한 추상 인터페이스.
 * 각 SDK 어댑터는 이 인터페이스를 구현한다.
 */
export interface IMapProvider {
  initialize(
    container: HTMLElement,
    options: MapInitOptions,
  ): void | Promise<void>;
  destroy(): void;
  isInitialized(): boolean;

  setCenter(center: Coordinate): void;
  getCenter(): Coordinate;
  setZoom(zoom: number): void;
  getZoom(): number;
  panTo(center: Coordinate): void;

  addMarker(marker: Marker): void;
  updateMarker(marker: Marker): void;
  removeMarker(markerId: string): void;
  clearMarkers(): void;
  getMarkers(): Marker[];

  on<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void;
  off<T extends MapEvent>(event: T, handler: MapEventHandler<T>): void;
}
