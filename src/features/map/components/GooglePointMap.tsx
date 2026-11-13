"use client";
import { useEffect, useRef, useState } from "react";
import { GoogleMapProvider } from "@/widgets/map/model/google-map-provider";
function LivePointMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  const container = useRef<HTMLDivElement>(null),
    provider = useRef<GoogleMapProvider | null>(null),
    initial = useRef({ latitude, longitude });
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    const map = new GoogleMapProvider();
    provider.current = map;
    void map
      .initialize(container.current, { center: initial.current, zoom: 16 })
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            "지도를 불러오지 못했어요. 네트워크와 Google Maps 키의 웹사이트 제한을 확인해주세요.",
          );
      });
    return () => {
      active = false;
      map.destroy();
      provider.current = null;
    };
  }, []);
  useEffect(() => {
    const fail = () =>
      setError(
        "Google 지도에서 이 주소의 접근을 허용하지 않았어요. 키의 웹사이트 제한에 현재 개발 주소를 추가해주세요.",
      );
    window.addEventListener("food-map-google-auth-error", fail);
    return () => window.removeEventListener("food-map-google-auth-error", fail);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const map = provider.current;
    if (!map) return;
    const coordinate = { latitude, longitude };
    map.panTo(coordinate);
    map.updateMarker({ id: "selected-place", coordinate, title });
  }, [ready, latitude, longitude, title]);
  return (
    <div
      role="region"
      aria-label={`${title} 지도`}
      data-map-status={error ? "error" : ready ? "ready" : "loading"}
      data-latitude={latitude}
      data-longitude={longitude}
      style={{ position: "absolute", inset: 0 }}
    >
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      {!ready && !error && (
        <p role="status" className="map-location-status loading">
          지도를 불러오고 있어요.
        </p>
      )}
      {error && (
        <p role="alert" className="map-location-status error">
          {error}
        </p>
      )}
    </div>
  );
}

export function GooglePointMap(props:{latitude:number;longitude:number;title:string;mode?:"mock"|"live"}){
 if(props.mode!=="live")return <div role="region" aria-label={`${props.title} 지도`} data-map-status="ready" data-latitude={props.latitude} data-longitude={props.longitude} style={{position:"absolute",inset:0,background:"repeating-linear-gradient(35deg,#e8edf1 0px,#e8edf1 65px,white 65px,white 80px)",display:"grid",placeItems:"center"}}><div style={{background:"white",padding:20,borderRadius:16,textAlign:"center"}}><span style={{color:"#3182f6",fontSize:32}}>●</span><h3>{props.title}</h3><p>모의 지도 · 실제 지도가 아니에요</p><p>{props.latitude.toFixed(4)}, {props.longitude.toFixed(4)}</p></div></div>;
 return <LivePointMap {...props}/>;
}
