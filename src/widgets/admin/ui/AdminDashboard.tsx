"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Usage = {
  mode: "mock" | "live";
  personalUsage: { api: string; count: number; mode: string }[];
  month: string;
  day: string;
  status: string;
  budget: null | { used: number; limit: number; dailyLimit: number };
  daily: { day: string; used: number }[];
  dailyUsed: number;
  monthlyRemaining: number;
  dailyRemaining: number;
  monitoringConfigured: boolean;
  browserMapEnabled: boolean;
  fetchedAt: string;
  snapshot: null | {
    fetchedAt: string;
    payload: {
      rows: { service: string; method: string; requests: number }[];
      startAt: string;
      endAt: string;
    };
  };
};
export function AdminDashboard() {
  const [data, setData] = useState<Usage | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const router = useRouter();
  async function load() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/usage", { cache: "no-store" });
      if (r.status === 401) {
        router.refresh();
        return;
      }
      const body = await r.json();
      if (!r.ok) throw new Error(body.message);
      setData(body);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "사용량을 불러오지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/usage", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.message);
        if (active) setData(body);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const limit = data?.budget?.limit ?? 0,
    used = data?.budget?.used ?? 0;
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const states: Record<string, string> = {
    LIMITS_DISABLED: "개발 중 · 검색 한도 해제",
    ACTIVE:
      data?.mode === "mock" ? "모의 조회 한도 보호 중" : "검색 한도 보호 중",
    BLOCKED: "검색 한도 도달 · 차단 중",
    UNCONFIGURED: "이번 달 사용량 설정 필요",
    DISABLED: "검색 비활성",
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/map" className="admin-brand">
          맛집지도 <small>Admin</small>
        </a>
        <nav aria-label="관리자 메뉴">
          <a href="/admin/api-usage" aria-current="page">
            API 사용량
          </a>
          <a href="/saved">맛집 관리</a>
          <a href="/categories">카테고리 관리</a>
        </nav>
        <a href="/map">서비스로 이동 ↗</a>
      </aside>
      <main className="admin-main">
        {" "}
        {data && (
          <section style={{ padding: 16 }}>
            <strong>
              {data.mode === "mock"
                ? "모의 API · 유료 호출 없음"
                : "실제 API · 한도 보호"}
            </strong>
            {data.personalUsage?.map((row) => (
              <p key={row.api}>
                {row.api}: {row.count}회 ({row.mode})
              </p>
            ))}
          </section>
        )}
        <header className="admin-heading">
          <div>
            <p className="eyebrow">비용 관리</p>
            <h1>API 사용량</h1>
            <p>검색 비용을 안전하게 관리해요.</p>
          </div>
          <div className="admin-actions">
            <button
              className="button button-primary"
              onClick={() => void load()}
              disabled={busy}
            >
              새로고침
            </button>
            <button
              className="button button-secondary"
              onClick={async () => {
                const r = await fetch("/api/auth/logout", { method: "POST" });
                if (!r.ok) {
                  setError("로그아웃하지 못했어요.");
                  return;
                }
                localStorage.setItem("food-map-session", String(Date.now()));
                window.location.replace("/login");
              }}
            >
              로그아웃
            </button>
          </div>
        </header>
        {error && (
          <p className="feedback feedback-error" role="alert">
            {error}
          </p>
        )}
        {!data && !error && <p role="status">사용량을 불러오고 있어요.</p>}
        {data && (
          <>
            <p className="admin-period">
              {data.month} · 미국 태평양 시간 · 조회{" "}
              {new Date(data.fetchedAt).toLocaleString("ko-KR")}
              {error ? " · 마지막 성공 조회값" : ""}
            </p>
            <section
              className={`admin-protection ${data.status !== "ACTIVE" ? "is-blocked" : ""}`}
            >
              <h2>{states[data.status] ?? "상태 확인 필요"}</h2>
              <p>
                {data.status === "LIMITS_DISABLED"
                  ? "개발용 한도 차단은 해제되어 있어요. Google 호출 수는 계속 집계합니다."
                  : "서버에서 허용한 요청만 Google로 전송해요. 실패한 요청도 보수적으로 사용량에 포함해요."}
              </p>
            </section>
            <div className="admin-stats">
              <section>
                <h2>이번 달 사용</h2>
                <strong>{data.budget ? used.toLocaleString() : "—"}</strong>
                <span> / {limit.toLocaleString()}회</span>
              </section>
              <section>
                <h2>남은 월 허용 요청</h2>
                <strong>
                  {data.status === "LIMITS_DISABLED"
                    ? "제한 해제"
                    : data.budget
                      ? data.monthlyRemaining.toLocaleString()
                      : "—"}
                </strong>
                <span>회</span>
              </section>
              <section>
                <h2>오늘 사용</h2>
                <strong>{data.dailyUsed}</strong>
                <span> / {data.budget?.dailyLimit ?? "—"}회</span>
                <p>오늘 남은 요청 {data.dailyRemaining}회</p>
              </section>
            </div>
            <div className="admin-columns">
              <div>
                <section className="admin-card">
                  <h2>이번 달 사용량</h2>
                  <progress
                    aria-label="월 검색 한도 사용량"
                    max={100}
                    value={percent}
                  />
                  <p>
                    {data.budget
                      ? `${percent.toFixed(1)}% 사용 중`
                      : "사용량 설정 전에는 검색이 차단됩니다."}
                  </p>
                </section>
                <section className="admin-card">
                  <h2>일별 허용 요청 수</h2>
                  <p>요청 수(회) · 날짜(미국 태평양 시간)</p>
                  {data.daily.length ? (
                    <div
                      className="admin-chart"
                      role="img"
                      aria-label={data.daily
                        .map((d) => `${d.day}: ${d.used}회`)
                        .join(", ")}
                    >
                      {data.daily.map((d) => (
                        <div className="admin-bar-column" key={d.day}>
                          <span>{d.used}</span>
                          <div
                            style={{
                              height: `${Math.max(2, (d.used / Math.max(1, ...data.daily.map((x) => x.used))) * 120)}px`,
                            }}
                          />
                          <small>{d.day.slice(5)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>아직 서버에서 허용한 검색 요청이 없어요.</p>
                  )}
                  <p className="field-help">
                    출처: 서버 요청 예약 기록. 초기 등록한 과거 사용량은 일별
                    차트에 포함되지 않아요.
                  </p>
                </section>
              </div>
              <section className="admin-card admin-policy">
                <h2>보호 설정</h2>
                <dl>
                  <dt>월 한도</dt>
                  <dd>{limit.toLocaleString()}회</dd>
                  <dt>일 한도</dt>
                  <dd>{data.budget?.dailyLimit ?? "—"}회</dd>
                  <dt>웹 지도 자동 로드</dt>
                  <dd>
                    {data.browserMapEnabled
                      ? "활성 · 별도 quota 필요"
                      : "비활성"}
                  </dd>
                </dl>
                <p>
                  {data.status === "LIMITS_DISABLED"
                    ? "개발 설정: 한도 초과 차단 해제"
                    : "✓ 한도 초과 시 검색 차단"}
                </p>
                <p>✓ DB 확인 실패 시 검색 차단</p>
                <p>✓ 다음 달은 사용량 확인 후 시작</p>
              </section>
            </div>
            <section className="admin-card">
              <div className="admin-heading">
                <div>
                  <h2>Google 사용량 대조</h2>
                  <p>
                    {data.monitoringConfigured
                      ? "프로젝트별 요청 수 · Google Cloud Monitoring"
                      : "연결 설정 필요 · 프로젝트 ID와 Monitoring 조회 인증을 연결해주세요."}
                  </p>
                </div>
                <button
                  className="button button-secondary"
                  disabled={busy || !data.monitoringConfigured}
                  onClick={async () => {
                    setBusy(true);
                    setNotice("");
                    try {
                      const r = await fetch("/api/admin/monitoring", {
                        method: "POST",
                      });
                      const b = await r.json();
                      if (!r.ok) throw new Error(b.message);
                      setNotice(
                        b.cached
                          ? "5분 이내 조회한 값을 사용했어요."
                          : "Google 사용량을 갱신했어요.",
                      );
                      await load();
                    } catch (e) {
                      setNotice(e instanceof Error ? e.message : "조회 실패");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Google 사용량 조회
                </button>
              </div>
              {notice && <p role="status">{notice}</p>}
              {data.snapshot && (
                <>
                  <p>
                    조회 시각:{" "}
                    {new Date(data.snapshot.fetchedAt).toLocaleString("ko-KR")}
                  </p>
                  <div className="admin-provider-rows">
                    {data.snapshot.payload.rows.map((row) => (
                      <div key={`${row.service}/${row.method}`}>
                        <span>
                          {row.service} / {row.method}
                        </span>
                        <strong>{row.requests.toLocaleString()}회</strong>
                      </div>
                    ))}
                  </div>
                  {!data.snapshot.payload.rows.length && (
                    <p>
                      해당 기간에 보고된 요청이 없습니다. 집계가 지연되었을 수
                      있어요.
                    </p>
                  )}
                </>
              )}
              <p className="field-help">
                Google 집계는 최대 수분 지연될 수 있어요. 요청 수는 무료
                잔여량·SKU별 과금량·청구 금액과 다릅니다. 즉시 차단에는 서버
                카운터를 사용합니다.
              </p>
            </section>
          </>
        )}
        <footer>조회 전용 · 한도 변경은 서버 설정에서 관리</footer>
      </main>
    </div>
  );
}
