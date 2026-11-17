"use client";
import { ServicePolicyLinks } from "@/features/legal/components/ServicePolicy";
import { notifySessionChanged } from "@/features/auth/model/session-change";
import { useState, useEffect } from "react";
import { createAccountApi } from "@food-map/registration";
const api = createAccountApi();
export function AccountSecurityForm({
  recover = false,
}: {
  recover?: boolean;
}) {
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [key, setKey] = useState(""),
    [issued, setIssued] = useState(""),
    [username, setUsername] = useState(""),
    [hasKey, setHasKey] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    if (recover) return;
    let active = true;
    void api
      .status()
      .then((r) => {
        if (active) {
          setUsername(r.username);
          setHasKey(r.hasRecoveryKey);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [recover]);
  async function action(kind: "find" | "issue" | "change" | "reset") {
    if (busy) return;
    setBusy(true);
    setNotice("");
    setError("");
    setIssued("");
    try {
      if (kind === "find") {
        const r = await api.findUsername(key);
        setUsername(r.username);
        setNotice(`아이디는 ${r.username}예요.`);
      }
      if (kind === "issue") {
        const r = await api.issueKey(current);
        setIssued(r.recoveryKey);
        setHasKey(true);
        setCurrent("");
        setNotice(
          "복구 키를 안전한 곳에 보관해주세요. 이 화면을 닫으면 다시 볼 수 없어요.",
        );
      }
      if (kind === "change" || kind === "reset") {
        if (kind === "change")
          await api.changePassword(current, password, confirm);
        else await api.resetPassword(key, password, confirm);
        setCurrent("");
        setPassword("");
        setConfirm("");
        setKey("");
        setDone(true);
        setNotice(
          "비밀번호를 변경했어요. 모든 기기에서 로그아웃됐어요. 다시 로그인한 뒤 새 복구 키를 발급해주세요.",
        );
        if (kind === "change") notifySessionChanged();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청을 처리하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="account-page">
      <section className="account-card">
        <h1>{recover ? "아이디·비밀번호 찾기" : "계정 보안"}</h1>
        <p>
          {recover
            ? "미리 발급받아 보관한 복구 키로 계정을 찾을 수 있어요. 최초 설정 토큰과는 다른 키예요."
            : `${username} · 비밀번호 변경과 복구 키를 관리해요.`}
        </p>
        {!done && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(recover ? "reset" : "change");
            }}
            style={{ display: "grid", gap: 16 }}
          >
            {recover ? (
              <>
                <label>
                  복구 키
                  <input
                    type="password"
                    autoComplete="off"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    maxLength={100}
                  />
                </label>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy || !key.trim()}
                  onClick={() => void action("find")}
                >
                  아이디 확인
                </button>
              </>
            ) : (
              <>
                <label>
                  현재 비밀번호
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                    maxLength={128}
                  />
                </label>
                <p>
                  {hasKey
                    ? "복구 키가 발급돼 있어요. 재발급하면 기존 키는 무효가 돼요."
                    : "아직 복구 키가 없어요. 비밀번호를 잊기 전에 발급해 보관해주세요."}
                </p>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={busy || !current}
                  onClick={() => void action("issue")}
                >
                  복구 키 발급·재발급
                </button>
              </>
            )}
            <label>
              새 비밀번호
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
            <p>
              12~128자로 입력해주세요. 변경 시 기존 복구 키와 모든 로그인 세션이
              폐기돼요.
            </p>
            <button className="button button-primary" disabled={busy}>
              {busy
                ? "처리 중…"
                : recover
                  ? "비밀번호 재설정"
                  : "비밀번호 변경"}
            </button>
          </form>
        )}
        {issued && (
          <section aria-label="발급된 복구 키">
            <p>이 키를 가진 사람은 계정 비밀번호를 재설정할 수 있어요.</p>
            <code
              style={{
                display: "block",
                overflowWrap: "anywhere",
                userSelect: "all",
              }}
            >
              {issued}
            </code>
            <button
              className="button button-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issued);
                  setNotice("복구 키를 복사했어요. 안전한 곳에 보관해주세요.");
                } catch {
                  setError("키를 직접 선택해 복사해주세요.");
                }
              }}
            >
              복구 키 복사
            </button>
            <button className="text-button" onClick={() => setIssued("")}>
              보관했어요
            </button>
          </section>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
        <a href="/login">로그인으로 돌아가기</a>
        {!recover && !done && <a href="/map">맛집 지도로 돌아가기</a>}
        {recover && (
          <p>
            복구 키가 없다면 로그인 후 계정 보안에서 먼저 발급해야 해요.
            비밀번호와 복구 키를 모두 잃었다면 이 화면으로 복구할 수 없어요.
          </p>
        )}
        <ServicePolicyLinks />
      </section>
    </main>
  );
}
