"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { IMapProvider } from "./map-provider";

const MapContext = createContext<IMapProvider | null>(null);

interface MapContextProviderProps {
  provider: IMapProvider;
  children: ReactNode;
}

export function MapContextProvider({
  provider,
  children,
}: MapContextProviderProps) {
  return (
    <MapContext.Provider value={provider}>{children}</MapContext.Provider>
  );
}

export function useMapContext(): IMapProvider {
  const provider = useContext(MapContext);

  if (!provider) {
    throw new Error("useMapContext must be used within MapProvider");
  }

  return provider;
}
