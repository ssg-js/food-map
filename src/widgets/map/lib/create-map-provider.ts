import { createStubMapProvider } from "../model/stub-map-provider";
import type { IMapProvider } from "../model/map-provider";

export type MapProviderType = "stub";

export function createMapProvider(type: MapProviderType = "stub"): IMapProvider {
  switch (type) {
    case "stub":
      return createStubMapProvider();
  }
}
