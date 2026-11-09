import assert from "node:assert/strict";
import { test } from "node:test";
import { GoogleMapProvider } from "../../src/widgets/map/model/google-map-provider";
import type {
  GoogleMap,
  GoogleMapOptions,
  GoogleMapsApi,
  GoogleMarker,
  GoogleLatLngLiteral,
} from "../../src/widgets/map/model/google-maps-types";

test("async map initialization cannot revive a destroyed provider or replace its next mount", async () => {
  let created = 0;
  let listeners = 0;
  class FakeMap implements GoogleMap {
    center: GoogleLatLngLiteral;
    zoom: number;
    constructor(_container: HTMLElement, options: GoogleMapOptions) {
      created++;
      this.center = options.center;
      this.zoom = options.zoom;
    }
    setCenter(center: GoogleLatLngLiteral) {
      this.center = center;
    }
    getCenter() {
      return { lat: () => this.center.lat, lng: () => this.center.lng };
    }
    setZoom(zoom: number) {
      this.zoom = zoom;
    }
    getZoom() {
      return this.zoom;
    }
    getBounds() {
      return null;
    }
    panTo(center: GoogleLatLngLiteral) {
      this.center = center;
    }
  }
  class FakeMarker implements GoogleMarker {
    setMap() {}
    setPosition() {}
    setTitle() {}
    addListener() {
      return { remove() {} };
    }
  }
  const maps: GoogleMapsApi = {
    Map: FakeMap,
    Marker: FakeMarker,
    event: {
      addListener() {
        listeners++;
        return {
          remove() {
            listeners--;
          },
        };
      },
    },
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { google: { maps } },
  });
  try {
    const provider = new GoogleMapProvider();
    const first = provider.initialize({} as HTMLElement, {
      center: { latitude: 37, longitude: 127 },
      zoom: 13,
    });
    provider.destroy();
    await first;
    assert.equal(created, 0);
    assert.equal(provider.isInitialized(), false);
    const stale = provider.initialize({} as HTMLElement, {
      center: { latitude: 37, longitude: 127 },
      zoom: 13,
    });
    provider.destroy();
    const active = provider.initialize({} as HTMLElement, {
      center: { latitude: 38, longitude: 128 },
      zoom: 14,
    });
    await Promise.all([stale, active]);
    assert.equal(created, 1);
    assert.equal(provider.isInitialized(), true);
    assert.deepEqual(provider.getCenter(), { latitude: 38, longitude: 128 });
    assert.equal(listeners, 4);
    provider.destroy();
    assert.equal(listeners, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
