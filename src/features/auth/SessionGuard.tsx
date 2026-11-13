"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
export function SessionGuard() {
  const client = useQueryClient(),
    path = usePathname();
  useEffect(() => {
    if (["/login", "/setup"].includes(path)) return;
    let stopped = false;
    let previous: string | undefined;
    const verify = async () => {
      try {
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        if (!r.ok) return;
        const b = await r.json();
        if (stopped) return;
        if (!b.user || (previous && previous !== b.user.id)) {
          client.clear();
          window.location.replace("/login");
        } else previous = b.user.id;
      } catch {
        /* network failures retain screen with normal request errors */
      }
    };
    const changed = () => void verify();
    void verify();
    window.addEventListener("focus", changed);
    window.addEventListener("pageshow", changed);
    window.addEventListener("storage", changed);
    return () => {
      stopped = true;
      window.removeEventListener("focus", changed);
      window.removeEventListener("pageshow", changed);
      window.removeEventListener("storage", changed);
    };
  }, [client, path]);
  return null;
}
