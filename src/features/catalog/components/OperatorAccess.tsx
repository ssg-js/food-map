"use client";
import { notifySessionChanged } from "@/features/auth/model/session-change";
import { personalQueryKeys } from "@food-map/registration";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
export function OperatorAccess({ ownerId }: { ownerId: string }) {
  const c = useQueryClient(),
    [error, setError] = useState("");
  const q = useQuery({
    queryKey: personalQueryKeys.session(ownerId),
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
      <a href="/account/security">계정 보안·비밀번호 변경</a>
      <a href="/terms">이용·데이터 안내</a>
      <button
        className="text-button"
        onClick={async () => {
          try {
            const r = await fetch("/api/auth/logout", { method: "POST" });
            if (!r.ok) throw new Error("로그아웃을 완료하지 못했어요.");
            c.clear();
            notifySessionChanged();
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
