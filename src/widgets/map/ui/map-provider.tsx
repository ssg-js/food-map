"use client";

import { useState, type ReactNode } from "react";

import { createMapProvider, type MapProviderType } from "../lib/create-map-provider";
import { MapContextProvider } from "../model/map-context";

interface MapProviderProps {
  children: ReactNode;
  /** 직렬화 가능한 SDK 선택 값. Server Component에서 전달 가능. */
  providerType?: MapProviderType;
}

export function MapProvider({
  children,
  providerType = "stub",
}: MapProviderProps) {
  const [provider] = useState(() => createMapProvider(providerType));

  return (
    <MapContextProvider provider={provider}>{children}</MapContextProvider>
  );
}
