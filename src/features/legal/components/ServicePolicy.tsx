import Link from "next/link";
import type { ReactNode } from "react";
export function ServicePolicyLinks() {
  return (
    <nav
      className="service-policy-links"
      aria-label="서비스 이용과 데이터 안내"
    >
      <Link href="/terms">서비스 이용 안내</Link>
      <Link href="/privacy">데이터 처리 안내</Link>
    </nav>
  );
}
export function ServicePolicy({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="policy-page">
      <header>
        <Link className="brand" href="/map">
          맛집지도
        </Link>
        <Link href="/login">로그인</Link>
        <ServicePolicyLinks />
      </header>
      <main className="policy-document">
        <p className="policy-version">2026년 11월 17일 · 운영 전 검토 초안</p>
        <h1>{title}</h1>
        <p className="policy-draft">
          현재 개인용 서비스의 코드 동작을 설명하는 안내입니다. 운영자 정보,
          호스팅·보관 정책과 요청 처리 경로는 배포 전에 확정해야 합니다.
        </p>
        {children}
        <section aria-labelledby="policy-pending">
          <h2 id="policy-pending">배포 전 확정할 운영 정보</h2>
          <p>
            운영자 이름과 연락처, 실제 인프라 제공자·처리 장소, 계정·인증
            기록·백업의 보관 및 파기 기간, 계정 삭제 등 요청 접수 경로는 아직
            확정되지 않았습니다. 이 초안을 최종 운영 약관이나
            개인정보처리방침으로 표시하지 않습니다.
          </p>
        </section>
        <footer>
          <Link href="/map">맛집 지도로 돌아가기</Link>
          <ServicePolicyLinks />
        </footer>
      </main>
    </div>
  );
}
