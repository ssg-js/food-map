"use client";
import { ServicePolicyLinks } from "@/features/legal/components/ServicePolicy";
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
          setError("");
          const f = new FormData(e.currentTarget);
          if (setup && f.get("password") !== f.get("passwordConfirmation")) {
            setError("비밀번호 확인이 일치하지 않아요. 다시 입력해주세요.");
            (
              e.currentTarget.elements.namedItem(
                "passwordConfirmation",
              ) as HTMLInputElement
            )?.focus();
            return;
          }
          setBusy(true);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20_000);
          try {
            const r = await fetch(
              setup ? "/api/auth/setup" : "/api/auth/login",
              {
                method: "POST",
                signal: controller.signal,
                cache: "no-store",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: f.get("username"),
                  password: f.get("password"),
                  ...(setup
                    ? { passwordConfirmation: f.get("passwordConfirmation") }
                    : {}),
                  token: f.get("token"),
                  adoptLegacy: f.get("adoptLegacy") === "on",
                }),
              },
            );
            const b = await r.json().catch(() => null);
            if (!r.ok)
              throw new Error(
                typeof b?.message === "string"
                  ? b.message
                  : "로그인 요청에 실패했어요. 잠시 후 다시 시도해주세요.",
              );
            window.location.replace(setup ? "/login" : "/map");
          } catch (e) {
            setError(
              controller.signal.aborted
                ? "응답이 늦어지고 있어요. 연결을 확인하고 다시 시도해주세요."
                : e instanceof TypeError
                  ? "서버에 연결하지 못했어요. 네트워크를 확인해주세요."
                  : e instanceof Error
                    ? e.message
                    : "연결을 확인해주세요.",
            );
          } finally {
            clearTimeout(timeout);
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
            <label>
              비밀번호 확인
              <input
                name="passwordConfirmation"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                aria-invalid={error.includes("일치하지")}
                aria-describedby={error ? "account-form-error" : undefined}
                onInput={() => setError("")}
              />
            </label>
            <p>
              비밀번호를 한 번 더 입력해주세요. 영문·숫자·밑줄 아이디, 비밀번호
              12자 이상
            </p>
            <label className="account-check">
              <input name="adoptLegacy" type="checkbox" />
              기존 공용 맛집과 카테고리를 내 계정으로 가져오기
            </label>
          </>
        )}
        {error && (
          <p id="account-form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" disabled={busy}>
          {busy ? "처리 중…" : setup ? "계정 만들기" : "로그인"}
        </button>
        {!setup && <a href="/recover">아이디·비밀번호 찾기</a>}
        <p>내가 저장한 맛집과 카테고리를 안전하게 보관해요.</p>
        <ServicePolicyLinks />
      </form>
    </main>
  );
}
