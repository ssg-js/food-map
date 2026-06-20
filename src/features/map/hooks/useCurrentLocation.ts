"use client";

import { useEffect, useState } from "react";

import type { GeolocationState } from "../model/types";

const INITIAL_STATE: GeolocationState = {
  status: "idle",
  position: null,
  errorMessage: null,
};

export function useCurrentLocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE);

  useEffect(() => {
    const geo = navigator.geolocation;

    if (!geo) {
      void Promise.resolve().then(() => {
        setState({
          status: "error",
          position: null,
          errorMessage: "이 브라우저는 위치 정보를 지원하지 않습니다.",
        });
      });
      return;
    }

    geo.getCurrentPosition(
      (position) => {
        setState({
          status: "success",
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          errorMessage: null,
        });
      },
      (error) => {
        const isDenied = error.code === error.PERMISSION_DENIED;

        setState({
          status: isDenied ? "denied" : "error",
          position: null,
          errorMessage: isDenied
            ? "위치 권한이 거부되었습니다. 기본 위치로 지도를 표시합니다."
            : error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  }, []);

  return state;
}
