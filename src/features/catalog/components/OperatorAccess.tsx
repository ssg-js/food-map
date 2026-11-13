"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
export function OperatorAccess() {
  const c = useQueryClient(),
    [error, setError] = useState("");
  const q = useQuery({
    queryKey: ["personal-session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/session", { cache: "no-store" });
      return r.json();
    },
    retry: false,
  });
  return (
    <section className="catalog-access">
      <span>{q.data?.user?.username} · 내 계정의 맛집만 표시돼요.</span>
      {q.data?.user?.role === "OPERATOR" && (
        <a href="/admin/api-usage">API 사용량</a>
      )}
      <button
        className="text-button"
        onClick={async () => {
          try {
            const r = await fetch("/api/auth/logout", { method: "POST" });
            if (!r.ok) throw new Error("로그아웃을 완료하지 못했어요.");
            c.clear();
            localStorage.setItem("food-map-session", String(Date.now()));
            window.location.replace("/login");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        로그아웃
      </button>
      {error && <span role="alert">{error}</span>}
    </section>
  );
}
