import { createGoogleMapProvider } from "../model/google-map-provider";
import type { IMapProvider } from "../model/map-provider";
import { createStubMapProvider } from "../model/stub-map-provider";

export type MapProviderType = "stub" | "google";

export function createMapProvider(type: MapProviderType = "stub"): IMapProvider {
  switch (type) {
    case "google":
      return createGoogleMapProvider();
    case "stub":
      return createStubMapProvider();
  }
}
