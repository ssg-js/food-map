import { create } from "zustand";

interface MapState {
  latitude: number;
  longitude: number;
  zoom: number;
  setCenter: (latitude: number, longitude: number) => void;
  setZoom: (zoom: number) => void;
}

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;
const DEFAULT_ZOOM = 13;

export const useMapStore = create<MapState>((set) => ({
  latitude: DEFAULT_LATITUDE,
  longitude: DEFAULT_LONGITUDE,
  zoom: DEFAULT_ZOOM,
  setCenter: (latitude, longitude) => set({ latitude, longitude }),
  setZoom: (zoom) => set({ zoom }),
}));
