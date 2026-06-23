import { create } from "zustand";

import {
  DEFAULT_MAP_LATITUDE,
  DEFAULT_MAP_LONGITUDE,
  DEFAULT_MAP_ZOOM,
} from "@/shared/constants/map";

interface MapState {
  latitude: number;
  longitude: number;
  zoom: number;
  setCenter: (latitude: number, longitude: number) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  latitude: DEFAULT_MAP_LATITUDE,
  longitude: DEFAULT_MAP_LONGITUDE,
  zoom: DEFAULT_MAP_ZOOM,
  setCenter: (latitude, longitude) => set({ latitude, longitude }),
  setZoom: (zoom) => set({ zoom }),
}));
