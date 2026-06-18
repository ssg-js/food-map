"use client";

import { useRef, type ReactNode } from "react";

import { MapContextProvider } from "../model/map-context";
import type { IMapProvider } from "../model/map-provider";

interface MapProviderProps {
  children: ReactNode;
  createProvider: () => IMapProvider;
}

export function MapProvider({ children, createProvider }: MapProviderProps) {
  const providerRef = useRef<IMapProvider | null>(null);

  if (!providerRef.current) {
    providerRef.current = createProvider();
  }

  return (
    <MapContextProvider provider={providerRef.current}>
      {children}
    </MapContextProvider>
  );
}
