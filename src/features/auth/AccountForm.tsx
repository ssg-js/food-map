"use client";
import { useState } from "react";
export function AccountForm({ setup = false }: { setup?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="account-page">
      <form
        className="account-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch(
              setup ? "/api/auth/setup" : "/api/auth/login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: f.get("username"),
                  password: f.get("password"),
                  token: f.get("token"),
                  adoptLegacy: f.get("adoptLegacy") === "on",
                }),
              },
            );
            const b = await r.json();
            if (!r.ok) throw new Error(b.message);
            window.location.replace(setup ? "/login" : "/map");
          } catch (e) {
            setError(e instanceof Error ? e.message : "연결을 확인해주세요.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p>나만의 맛집 지도</p>
        <h1>{setup ? "내 계정을 만들어요" : "다시 만나 반가워요"}</h1>
        {setup && (
          <label>
            최초 설정 토큰
            <input name="token" type="password" required autoComplete="off" />
          </label>
        )}
        <label>
          아이디
          <input
            name="username"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_]+"
            autoComplete="username"
            autoCapitalize="none"
          />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            required
            minLength={setup ? 12 : 1}
            maxLength={128}
            autoComplete={setup ? "new-password" : "current-password"}
          />
        </label>
        {setup && (
          <>
            <p>영문·숫자·밑줄 아이디, 비밀번호 12자 이상</p>
            <label className="account-check">
              <input name="adoptLegacy" type="checkbox" />
              기존 공용 맛집과 카테고리를 내 계정으로 가져오기
            </label>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <button className="button button-primary" disabled={busy}>
          {busy ? "처리 중…" : setup ? "계정 만들기" : "로그인"}
        </button>
        <p>내가 저장한 맛집과 카테고리를 안전하게 보관해요.</p>
      </form>
    </main>
  );
}
