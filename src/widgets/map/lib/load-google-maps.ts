import type { GoogleMapsApi } from "../model/google-maps-types";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-javascript-api";
const GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/js";

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

function getGoogleMapsApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.");
  }

  return apiKey;
}

export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
          return;
        }

        reject(new Error("Google Maps JavaScript API failed to initialize."));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Google Maps JavaScript API failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    const searchParams = new URLSearchParams({
      key: getGoogleMapsApiKey(),
      v: "weekly",
    });

    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `${GOOGLE_MAPS_API_URL}?${searchParams.toString()}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      reject(new Error("Google Maps JavaScript API failed to initialize."));
    });
    script.addEventListener("error", () => {
      reject(new Error("Google Maps JavaScript API failed to load."));
    });

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
