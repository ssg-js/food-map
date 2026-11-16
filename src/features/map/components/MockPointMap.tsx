"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  inViewport,
  viewportFromCenter,
  wrapLongitude,
} from "@food-map/registration";
import type { PointProps } from "./GooglePointMap";
export function MockPointMap(props: PointProps) {
  const { onViewportChange } = props;
  const element = useRef<HTMLDivElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      latitude: number;
      longitude: number;
    } | null>(null);
  const [camera, setCamera] = useState({
      latitude: props.latitude,
      longitude: props.longitude,
      zoom: 14,
    }),
    [size, setSize] = useState({ width: 800, height: 480 });
  const bounds = useMemo(
    () => viewportFromCenter(camera, camera.zoom, size.width, size.height),
    [camera, size],
  );
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0)
        setSize((old) =>
          old.width === entry.contentRect.width &&
          old.height === entry.contentRect.height
            ? old
            : {
                width: entry.contentRect.width,
                height: entry.contentRect.height,
              },
        );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    onViewportChange?.(bounds);
  }, [bounds, onViewportChange]);
  const width = (bounds.east - bounds.west + 360) % 360 || 360;
  const presets = [
    { name: "성수", latitude: 37.5455, longitude: 127.0543 },
    { name: "강남", latitude: 37.4979, longitude: 127.0276 },
    { name: "서울시청", latitude: 37.5665, longitude: 126.978 },
  ];
  return (
    <div
      ref={element}
      role="region"
      aria-label={`${props.title} 지도`}
      data-testid="mock-map-surface"
      data-map-status="ready"
      data-latitude={camera.latitude}
      data-longitude={camera.longitude}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
        background:
          "repeating-linear-gradient(35deg,#e8edf1 0px,#e8edf1 65px,white 65px,white 80px)",
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          latitude: camera.latitude,
          longitude: camera.longitude,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const start = drag.current;
        if (!start) return;
        setCamera((c) => ({
          ...c,
          latitude: Math.max(
            -84,
            Math.min(
              84,
              start.latitude +
                ((e.clientY - start.y) * (bounds.north - bounds.south)) /
                  size.height,
            ),
          ),
          longitude: wrapLongitude(
            start.longitude - ((e.clientX - start.x) * width) / size.width,
          ),
        }));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <div className="mock-map-caption">
        <strong>
          {props.onViewportChange ? "현재 지도 범위" : props.title}
        </strong>
        <span>모의 지도 · 실제 지도가 아니에요</span>
        <small>드래그로 이동 · 확대/축소 가능</small>
      </div>
      <div aria-label="지도 핀">
        {props.points
          ?.filter((p) => inViewport(p, bounds))
          .map((p, i) => (
            <button
              key={p.id}
              aria-label={`${p.title} 핀`}
              data-place-id={p.id}
              data-latitude={p.latitude}
              data-longitude={p.longitude}
              data-highlighted={props.activeId === p.id}
              className="search-map-pin"
              style={{
                left: `${(((p.longitude - bounds.west + 360) % 360) / width) * 100}%`,
                top: `${((bounds.north - p.latitude) / (bounds.north - bounds.south)) * 100}%`,
                transform: `translate(-50%,-50%) scale(${props.activeId === p.id ? 1.2 : 1})`,
                zIndex: props.activeId === p.id ? 20 : 10,
              }}
              onMouseEnter={() => props.onHover?.(p.id)}
              onMouseLeave={() => props.onHover?.(null)}
              onFocus={() => props.onHover?.(p.id)}
              onBlur={() => props.onHover?.(null)}
              onClick={() => props.onSelect?.(p.id)}
              title={p.title}
            >
              {i + 1}
            </button>
          ))}
      </div>
      {!props.points?.length &&
        props.showMarker !== false &&
        inViewport(
          { latitude: props.latitude, longitude: props.longitude },
          bounds,
        ) && (
          <div
            aria-hidden="true"
            className="mock-location-dot"
            style={{
              left: `${(((props.longitude - bounds.west + 360) % 360) / width) * 100}%`,
              top: `${((bounds.north - props.latitude) / (bounds.north - bounds.south)) * 100}%`,
            }}
          />
        )}
      <div className="mock-map-zoom">
        <button
          aria-label="지도 확대"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(19, c.zoom + 1) }))
          }
        >
          ＋
        </button>
        <button
          aria-label="지도 축소"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(3, c.zoom - 1) }))
          }
        >
          −
        </button>
      </div>
      <div className="mock-map-presets">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => setCamera({ ...p, zoom: 14 })}
            aria-label={`모의 지도 ${p.name}${p.name === "강남" ? "으로" : "로"} 이동`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
