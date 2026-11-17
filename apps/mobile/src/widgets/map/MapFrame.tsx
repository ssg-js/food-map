import { useEffect, useMemo, useRef } from "react";
import { WebView } from "react-native-webview";
import {
  readMapEvent,
  sessionHeaders,
  type SearchMapEvent,
  type SearchMapState,
} from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
/** Fixed authenticated document. Place/GPS state travels only through the validated bridge. */
export function MapFrame({
  state,
  onEvent,
  onError,
}: {
  state: SearchMapState;
  onEvent: (event: SearchMapEvent) => void;
  onError?: () => void;
}) {
  const frame = useRef<WebView<Record<never, never>>>(null);
  const latest = useRef({ state, onEvent });
  useEffect(() => {
    latest.current = { state, onEvent };
  }, [state, onEvent]);
  const source = useMemo(
    () => ({ uri: `${apiBaseUrl}/map-search`, headers: sessionHeaders() }),
    [],
  );
  const send = () => {
    const json = JSON.stringify(JSON.stringify(latest.current.state));
    frame.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`,
    );
  };
  useEffect(() => {
    const json = JSON.stringify(JSON.stringify(state));
    frame.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`,
    );
  }, [state]);
  return (
    <WebView<Record<never, never>>
      ref={frame}
      source={source}
      style={{ flex: 1 }}
      originWhitelist={[new URL(apiBaseUrl).origin]}
      onShouldStartLoadWithRequest={(request) => {
        try {
          const url = new URL(request.url);
          return (
            url.origin === new URL(apiBaseUrl).origin &&
            url.pathname === "/map-search"
          );
        } catch {
          return false;
        }
      }}
      onLoadEnd={send}
      onError={onError}
      onHttpError={onError}
      onMessage={(event) => {
        try {
          const url = new URL(event.nativeEvent.url);
          if (
            url.origin !== new URL(apiBaseUrl).origin ||
            url.pathname !== "/map-search"
          )
            return;
          const message = readMapEvent(JSON.parse(event.nativeEvent.data));
          if (!message) return;
          if (message.type === "map-ready") send();
          else latest.current.onEvent(message);
        } catch {}
      }}
    />
  );
}
