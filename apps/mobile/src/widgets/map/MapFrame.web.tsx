import { useEffect, useRef } from "react";
import {
  readMapEvent,
  type SearchMapEvent,
  type SearchMapState,
} from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
export function MapFrame({
  state,
  onEvent,
  onError,
}: {
  state: SearchMapState;
  onEvent: (event: SearchMapEvent) => void;
  onError?: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ state, onEvent });
  const origin = new URL(apiBaseUrl).origin;
  useEffect(() => {
    latest.current = { state, onEvent };
  }, [state, onEvent]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(state, origin);
  }, [state, origin]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const message = readMapEvent(event.data);
      if (!message) return;
      if (message.type === "map-ready")
        frame.current?.contentWindow?.postMessage(latest.current.state, origin);
      else latest.current.onEvent(message);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [origin]);
  return (
    <iframe
      ref={frame}
      title="검색 지도"
      src={`${apiBaseUrl}/map-search`}
      onLoad={() =>
        frame.current?.contentWindow?.postMessage(latest.current.state, origin)
      }
      onError={onError}
      style={{ width: "100%", height: "100%", border: 0 }}
    />
  );
}
