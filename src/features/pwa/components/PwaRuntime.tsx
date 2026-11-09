"use client";
import { useEffect, useState } from "react";
export function PwaRuntime() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Installation stays optional if browser policy blocks service workers. */
      });
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? (
    <div className="offline-banner" role="status">
      인터넷에 연결되어 있지 않아요. 검색과 저장은 연결 후 이용해주세요.
    </div>
  ) : null;
}
