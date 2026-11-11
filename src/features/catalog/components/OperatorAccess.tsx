"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createCatalogApi } from "@food-map/registration";
const api = createCatalogApi();
export function OperatorAccess() {
  const client = useQueryClient(),
    auth = useQuery({
      queryKey: ["operator"],
      queryFn: api.authenticated,
      retry: false,
    });
  const [key, setKey] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="catalog-access">
      {auth.data ? (
        <>
          <span>관리자 권한으로 공용 목록을 수정할 수 있어요.</span>
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              await api.logout();
              client.setQueryData(["operator"], false);
            }}
          >
            권한 종료
          </button>
        </>
      ) : (
        <details>
          <summary>수정·삭제 권한 확인</summary>
          <p>
            이 목록은 함께 사용해요. 공용 데이터를 변경하려면 관리자 접근 키로
            로그인해주세요.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api.login(key);
                setKey("");
                client.setQueryData(["operator"], true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "로그인 실패");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="operator-key">관리자 접근 키</label>
            <div className="input-row">
              <input
                id="operator-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button className="button button-primary" disabled={busy}>
                권한 확인
              </button>
            </div>
          </form>
          {error && <p role="alert">{error}</p>}
        </details>
      )}
    </section>
  );
}
