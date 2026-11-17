# 맛집지도 배포 준비 종합 감사와 개발 결과

검토 시작: 2026-11-17. 최종 검증: 2026-11-18. 검토 시작 커밋: `fd9780c`. 작업 브랜치: `feature/deployment-readiness-audit`.
대상: 개인용 맛집 보관 서비스의 Next 웹/API·PWA·Expo 앱·공유 패키지·Prisma·디자인·제품 문서·실행 스크립트.

## 판단

**확인된 코드 결함과 문서 누락은 보완했다. 현재 로컬 설정을 그대로 클라우드에 올리는 것은 권장하지 않는다. 실제 운영 배포는 환경 검증 대기 상태다.**

소유권 검사는 서버·DB 복합 FK로 구현되어 있었고, 이번에도 실제 A/B 계정 테스트를 유지했다. 다만 공개 보안 권고가 있는 Next 버전, 익명 지도 프레임, 앱의 HTTP 주소와 계정 전환, 잘못된 예산 소진, 큰 요청과 캐시 정책 등은 배포 전에 수정할 필요가 있었다. 해당 항목을 재현·수정하고 회귀 테스트를 추가했다.

운영 HTTPS·DB 접근 제한·복원 리허설·Google 콘솔의 키/SKU 제한·최종 사용자 고지·실기기 증거는 저장소만으로 확인할 수 없다. ‘코드를 검토했다’는 이유로 이 항목을 완료로 처리하지 않았다. 실제 배포, 유료 계정 연결, 실제 Google 호출, 운영 데이터/스키마 변경은 수행하지 않았다.

## 검토 방법과 범위

디자인/PM, 프론트, 백엔드 담당으로 나눠 자료를 읽고 상위 통합 검토에서 근거·명세·변경 계약·검증을 대조했다. 감사 시점의 프론트 정적 탐색은 TS/TSX 141개와 페이지/API 진입점 35개를 기준으로 했고, 백엔드는 15개 Route Handler와 공통 인증/카탈로그/외부 API 모듈을 검토했다. 이후 새 안내 화면·가드·테스트가 추가됐다.

- 코드 읽기와 사용처 탐색: 인증·인가·CSRF·데이터 격리·외부 입력·캐시·비밀정보·지도 통신·요청 한도·실패 상태·중복 경로.
- 모델/문서 대조: 개인 서비스 FR, 실제 Prisma 모델/마이그레이션, ADR, 확정/수정중 디자인, 웹/앱 구현.
- 의존성: npm 공식 audit 결과와 공개 권고, 강제 메이저 변경 없는 수정, 전체/런타임 그래프 분리 확인.
- Git/로컬: `.env` 추적 여부와 권한, 45개 기존 커밋의 Google 키/개인키 패턴 이력 검색. 값은 출력/보고서에 기록하지 않았다. 패턴 검색에서 일치가 없다는 것은 모든 종류의 비밀 누출이 없다는 증명은 아니다.
- 실행: 실제 로컬 Next 서버·분리 PostgreSQL 스키마·웹/Expo 브라우저·계약 기반 외부 mock, 앱 번들 생성.

이 검토는 침투 테스트, 실시간 부하 시험, 클라우드 계정·IAM·방화벽 점검이나 법적 고지의 최종 적합성 검토를 대신하지 않는다. 라이브 키 제한은 실제 콘솔에서 읽지 않았다.

## 1. 보안·로컬/클라우드 설정

### DEP-01 · P1 · 공개 권고가 있는 프레임워크와 의존성

시작 시 Next `16.2.9`, 웹 전체 audit 20개 패키지(Critical 1/High 10/Moderate 9), 앱 8개(Moderate)였다. Next의 권고 중 일부는 Server Actions·이미지 처리·캐시 등 특정 기능/환경을 전제로 한다. 현재 앱에서 모든 권고의 실제 악용을 재현한 것은 아니다.

조치: Next와 `eslint-config-next`를 같은 메이저 `16.4.6`으로 맞추고 `npm audit fix`의 호환 범위 수정만 수행했다. 루트 `@next/env`도 동일 버전으로 명시했다. 검증된 Node 24와 npm/lockfile 사용을 문서·package 설정에 맞췄다. Prisma·Expo에 대한 `--force` 제안은 적용하지 않았다.

수정 후 웹 전체 3 High, 앱 3 Moderate가 남는다. **각각 하나의 하위 취약점이 상위 의존성으로 전파되어 집계되는 3개 패키지이며, 독립된 공격 6건을 뜻하지 않는다.**

- 웹: `deepmerge-ts@7.1.5 → @prisma/config → prisma@6.19.3`, 재귀 객체 merge의 스택 소진 권고. 현재 HTTP 입력이 이 CLI 설정 merge로 전달되는 경로는 찾지 못했다. Prisma CLI를 devDependencies로 분리했지만 `@prisma/client`의 optional peer 때문에 `npm audit --omit=dev`에도 3건이 남는다. 단순 분리로 취약점이 사라졌다고 보고하지 않는다. 생성/migration 빌드 도구 격리와 별도 Prisma 메이저 업그레이드 검증이 필요하다.
- 앱: `minimatch → @expo/fingerprint → expo`, 빌드 도구의 glob 처리 DoS 권고. 현재 UI가 외부 사용자 glob을 처리하는 경로는 찾지 못했다. 자동 제안인 Expo 52 다운그레이드는 SDK 58 프로젝트를 깨뜨릴 수 있어 적용하지 않았다. 신뢰한 소스만 빌드하고 별도 SDK 호환 업그레이드를 추적한다.

기계 판독 근거: [의존성 전후 집계](2026-11-17-dependency-audit.json). 실제 배포 artifact의 포함 모듈과 잔여 도구 위험은 배포 시 다시 판단해야 한다.

### DEP-02 · P1 · 개발 기본값의 운영 사용 방지

기존에는 인증 baseURL/trustedOrigins가 localhost로 fallback하고 운영 DB/TLS/비밀값의 사전 확인 경로가 없었다. 키만 복사하면 배포 준비가 됐다고 오해할 수 있었다.

조치: `src/shared/config/deployment.ts`, `src/instrumentation.ts`, `scripts/check-deployment.mjs` 추가. 운영 표식(`DEPLOYMENT_ENV=production`, 또는 Vercel production)이 활성화된 서버는 부적절한 비밀값·운영 origin·DB/TLS·live 키/한도 설정을 거부한다. `build:production`, `start:production`도 같은 사전검사를 사용한다. 로컬 `npm run dev`/로컬 프로덕션 확인은 유지한다. 모든 경고는 필드명/설명만 기록하고 비밀값을 출력하지 않는다.

현재 개발 설정을 읽기 전용 production 검사에 넣었을 때 RUNTIME_GUARD, AUTH_ORIGIN, TRUSTED_ORIGINS, DATABASE_TARGET 오류를 확인했다. 이는 **개발 설정을 운영에 그대로 쓰면 안 된다는 정상 차단 결과**이며 사용자 설정을 임의 수정하지 않았다. [비밀값 없는 설정 검사 결과](2026-11-17-local-config-check.json)를 저장했다.

앱에는 별도 `check:mobile-release`/`mobile:export:production`을 추가했다. 실제 릴리스는 명시한 HTTPS API origin을 요구한다. 로컬 HTTP는 개발 중 또는 명시적인 웹 QA 플래그+loopback 조합만 허용한다. QA export를 배포에 재사용하지 않는다.

### DEP-03 · P2 · 응답 보안 헤더와 로컬 비밀 파일

`next.config.ts`에 nosniff, strict-origin-when-cross-origin, SAMEORIGIN, geolocation(self) 및 카메라/마이크 제한, 기본 CSP를 추가했다. 운영 표식에서는 HSTS도 설정하며 `X-Powered-By`를 제거했다. 동일 origin iframe은 앱 지도 때문에 유지한다.

기본 CSP는 base-uri/object-src/frame-ancestors/form-action 제약이다. nonce 기반 script-src까지 적용한 완전한 스크립트 제한은 아니며 XSS 전체 해결로 표현하지 않는다. 외부 문자열은 React 렌더링, 링크는 허용 프로토콜 검증을 사용한다.

현재 로컬 `.env`는 Git에서 제외되어 있었지만 파일 권한은 0644였다. 값 변경 없이 0600으로 제한했다. 클라우드 자격증명/백업 파일의 실수 커밋 방지 패턴도 `.gitignore`에 추가했다. Git에 API 키 값·복구 키·서비스 계정 키를 새로 저장하지 않았다.

## 2. 백엔드 개발 지시와 반영

세부 코드 위치·재현·단위/제품 수용 기준은 [백엔드 상세 보고서](2026-11-17-backend-review.md)에 있다.

- **BE-01 · P2 / 수정**: 개인 한도 거절 전에 공유 예산이 별도 커밋되어 실제 Google 호출 없이 소진됐다. 모든 예약을 한 트랜잭션으로 묶었다. 개인/공유 거절 시 양방향 롤백과 동시 요청 제한을 실제 DB로 검증했다. 외부 호출 전에 커밋하고 외부 오류 요청을 환불하지 않는 정책은 유지한다.
- **BE-02 · P2 / 수정**: 임의 username마다 기록이 증가하고 로그인 비용을 반복시킬 수 있었다. DB 기반 전역 100회/15분과 실제 계정 10회/15분, 기간 prefix·제한된 정리 배치를 추가했다. 전역 한도도 공격자가 채울 수 있으므로 edge 출발지 제한을 대신하지 않는다.
- **BE-03 · P2 / 수정**: JSON 전체를 먼저 읽었다. POST/PATCH 8개에 실제 64KiB·10초 스트리밍 제한을 적용했다. Content-Length 누락/위조도 검사하며 400/408/413과 no-store로 응답한다. TCP/프록시 단계의 버퍼·연결 폭주 제한은 별도다.
- **BE-04 · P2 / 수정**: 일부 성공/오류 응답의 캐시 정책이 달랐다. `privateJson`으로 개인 성공·검증 오류·삭제·로그아웃의 private/no-store를 일관화했다. 기존 기본 설정에서 계정 간 캐시 누출을 재현했다는 뜻은 아니다.
- **BE-05 · P2 / 수정**: DB CHECK가 없는 개인 ApiUsage 음수를 앱에서도 차단한다. 기존 공유 예산에는 이미 CHECK가 있었으므로 해당 보호가 없었다고 주장하지 않는다.
- **BE-06 · P3 / 수정**: trustedOrigins 공백 정규화, 검색 취소 signal 전파를 보완했다.

현재 서버 인가의 중요한 기반은 유지했다. 요청의 ownerId를 믿지 않고 세션 사용자로 검사하며, 소유자 복합 FK로 타인 카테고리 연결을 막는다. 역할이 OPERATOR라고 타인의 보관함을 허용하지 않는다. 비밀번호는 검증된 해시, 복구 키는 원문 대신 해시, 변경/복구 시 세션 폐기를 유지한다.

## 3. 프론트·컴포넌트·성능 개발 지시와 반영

세부 근거는 [프론트 상세 보고서](2026-11-17-frontend-review.md)에 있다.

- **FE-01 · P1 / 수정**: 릴리스 API의 localhost fallback·외부 HTTP를 제거하고 공개 번들에는 서버 비밀값이 들어가지 않게 경계를 명시했다.
- **FE-02 · P1 / 수정**: 앱 전경 재검증에서 다른 계정 응답을 무시하던 문제를 고쳤다. 이전 사용자 UI/쿼리/토큰을 정리하고 늦은 세션 응답을 버린다. 웹 SessionGuard도 페이지 간 이전 계정 식별을 유지한다.
- **FE-03 · P1 / 수정**: 공개 지도 프레임을 서버에서 인증한다. native WebView는 Bearer **헤더**를 쓰고 토큰을 URL/HTML로 전달하지 않는다. 익명 거부와 Bearer 200을 실제 서버에서 검증했다.
- **FE-04 · P2 / 수정**: 저장 지도의 lat/lng/points URL과 선택 시 재로드를 공통 고정 `MapFrame`으로 교체했다. 검색·저장 화면은 검증된 메시지 계약과 프레임을 재사용한다. GPS와 카메라를 분리하고 현재 위치 복귀를 유지했다. 좌표 query가 접근 로그에 남을 경로와 불필요한 Maps 초기화를 줄였다. 이전 `/map-preview`는 인증된 호환 경로로만 남아 있으며 제품 앱은 좌표 URL을 만들지 않는다.
- **FE-05 · P2 / 수정**: localStorage 차단으로 성공 로그아웃이 중단되지 않게 알림을 best-effort로 만들었다. 계정/로그인 요청은 타임아웃·비JSON 오류·DTO 검사로 영구 로딩과 잘못된 응답을 처리한다.
- **FE-06 · P2 / 수정**: Places 제공자 귀속과 안전한 링크, 핵심 터치 영역, 개인용 화면 문구를 보완했다.
- **FE-07 · 현행 FR 누락 / 보완**: 캐시 전체 정리만으로 계정 식별자 query namespace 요구를 만족했다고 처리하지 않는다. 제품의 개인 분류/보관함/장소 쿼리 및 invalidation을 계정 ID 기준으로 분리하고 웹/앱 사용자 경계를 명시한다. 중앙 personalQueryKeys와 인증된 ownerId를 적용했고, A/B 동일 조건·늦은 응답·owner 한정 무효화 테스트 4건을 통과했다.

### 낭비를 어떻게 판단했는가

실행 비용과 소스 관리 부담을 나눴다. 정적 탐색에서 제품 진입점에 도달하지 않은 구형 UI/훅/API 파일 18개는 제거 후보로 남겼다. MapView·MapContainer의 과거 UI 묶음, 과거 관리자 키 UI, 공통 패키지로 대체된 등록 API/훅이 포함된다. 사용 중인 GoogleMapProvider/model까지 폴더 단위로 지우면 오히려 기능을 깨뜨린다. 구형 코드가 모두 사용자 번들에 내려간다는 근거는 없으므로 용량 절감을 꾸며내지 않았다.

실제로 소스 import가 없는 `react-native-maps`와 해당 Android key plugin/예제는 제거했다. 검색·저장 지도는 공통 프레임/미리보기로 통합했다. 정확한 APK/IPA 크기 감소는 측정하지 않았다. 동일 queryKey로 관찰하는 저장 카드와 부모의 `useQueries`는 요청 공유가 있으므로 observer 수만 보고 이중 API 호출로 판정하지 않았다.

나머지 구형 export/옛 e2e 파일은 현재 진입·테스트 설정과 연결 여부를 기록하고 별도 작은 정리 작업으로 남겼다. 현재 제품 테스트 실행 경로는 `tests/product`이며, `tests/e2e`에 파일이 있다는 이유만으로 최신 계약을 검증한 것으로 세지 않는다. PWA 오프라인 검증은 이번에 현재 제품 suite로 옮겨 실제 실행했다.

## 4. PM·디자인 누락과 구현 지시

[PM/디자인 상세 보고서](2026-11-17-design-pm-review.md)에 요구사항 추적과 화면별 인수 조건을 저장했다.

- 오래된 ‘명세 초안/개발 미착수’, 이미 구현된 결정을 미결정으로 남긴 상태, 현재 모델에 User/owner가 없다는 설명을 수정했다.
- 공용 카테고리/관리자 키로 변경한다는 옛 설명과 Apple Maps/Android Maps SDK를 쓴다는 README를 실제 개인 세션·Maps JavaScript 프레임 구조에 맞췄다.
- 후속 복구/비밀번호 확인/viewport/별도 현재 위치 요구와 3그룹·최소 1개·마지막 분류 보호를 현재 명세에 추적했다.
- `디자인/수정중/{웹,앱}/09_배포전상태점검`에 실패·빈·로딩·충돌·권한/접근성 인수 조건을 정리했다.
- 새 `10_서비스안내` 웹/앱 시안을 **구현 전에** HTML/문서로 저장하고 `/terms`, `/privacy`와 로그인/계정/앱 링크를 구현했다. 공개 문서는 로그인 전에도 읽을 수 있다. 운영자·연락처·처리 장소·보관/삭제 기간을 임의 작성하지 않았다.
- 새 시안은 사용자 확정 전이므로 수정중에 보관했다. 배포를 준비한다는 이유로 확정 폴더에 임의 승격하지 않았다.

기술 안내 페이지 구현은 완료됐지만 최종 공개 운영 고지가 확정됐다는 뜻은 아니다. Google 연결 관련 조건은 [Places 공식 정책](https://developers.google.com/maps/documentation/places/web-service/policies)을 근거로 하며 실제 서비스 정보와 적용 지역 요건을 운영 전에 확인해야 한다.

## 5. 아직 배포 전에 확인할 조건

### 운영 환경과 복원 · P1

호스팅/도메인/운영 DB가 아직 이 감사에 연결되지 않았다. HTTPS/인증 쿠키/Host 처리, DB TLS와 네트워크·최소 권한, pool/동시 연결, 백업·PITR/별도 DB 복원, 비밀값 주입·로그 제거를 실제 환경에서 확인해야 한다. 현재 로컬 URL/DB를 운영 환경으로 그대로 복사하지 않는다.

과거 `backup-before-personal.mjs`의 JSON은 계정·세션·복구 데이터를 포함하는 전체 복원 백업이 아니다. 이번 환경에는 pg_dump/pg_restore가 없어 실제 전체 복원을 검증하지 않았다.

### 과금·Google 제한 · P1

Places 서버 카운터는 브라우저 Maps JavaScript 로드나 키의 외부 사용을 제한하지 않는다. [Google 비용 관리](https://developers.google.com/maps/billing-and-pricing/manage-costs)와 [키 보안 지침](https://developers.google.com/maps/api-security-best-practices)에 따라 키 분리·API/application 제한·SKU별 quota·알림·운영 예산을 확인한다. 예산 알림이나 내부 카운터를 모든 과금의 차단 보증으로 설명하지 않는다. 실제 콘솔 상태/기존 청구량은 이번에 조회하지 않았다.

### 공개 안내 확정 · P1

운영자 연락처, 데이터 처리 위치/인프라 제공자, 인증·사용량·백업 보관/파기 기간, 계정 삭제 요청 절차를 확정해야 한다. 현재 `/terms`, `/privacy`는 실제 코드 동작을 설명하는 초안이며 최종 고지로 오인하지 않게 표시했다.

### 실제 기기와 운영 smoke · P1

iOS/Android 실제 WebView Bearer 헤더·위치 권한 거부/재허용·키보드/안전 영역/글자 확대, HTTPS에서 PWA 설치·업데이트·세션을 확인한다. 앱 식별자는 `.development`이고 local networking 설정이 있어 스토어용 식별자·서명·권한 선언은 릴리스 때 확정해야 한다. 번들 생성은 IPA/APK·스토어 심사·실기기 통과가 아니다.

### 유지보수·가용성 · P2/P3

잔여 CLI 취약 패키지의 메이저 업그레이드/위험 판단, 완전한 nonce CSP, edge 요청 제한, 관측/알림, 실제 부하·접근성 계측은 후속이다. Monitoring은 아직 비활성이며 나중에 연결할 때 최대 페이지/요청 시간과 호스팅 실행 제한을 맞춰야 한다. SDK 로더의 일시 실패 후 복원성, 외부 Place DTO의 중첩 필드 검증도 추가 개선할 수 있다.

초기 계정 설정 중 프로세스가 종료되어 CLAIMED로 남는 경우 자동으로 READY를 되돌리지 않는다. 실행 중 요청과 생성된 계정을 확인하고 서버 중지·백업 후 복구해야 한다. 로그인 시도·만료 세션·사용량·백업 보관 기간도 운영 정책에 맞춰 정리한다. 구형 해시 행/사용자 계정은 이번 감사에서 일괄 삭제하지 않았다.

## 6. 검증 기록

최종 결과는 아래 기록과 검증 JSON으로 확정한다. 초기 검증 중 DB CHECK가 음수 공유 예산을 이미 거부한다는 사실을 테스트에 반영했고, 새 앱 테스트가 로그인 완료 전에 API를 호출하던 대기 순서도 바로잡았다. 테스트 실패를 숨기거나 프로덕션 코드를 시험에 맞춰 보호 수준이 낮아지게 수정하지 않았다.

- 웹·앱 lint / TypeScript 모두 통과. 단위/MSW 50건 통과. Next 16.4.6 프로덕션 빌드 통과.
- 실제 로컬 서버·분리 DB 웹 제품: 58건 통과(계정/소유권·CSRF·CRUD·복구·쿼터·viewport/GPS·공개 안내·프레임 인증·보안 헤더·PWA 캐시).
- PostgreSQL 통합: 1개 통합 시나리오 통과(기존 migration, 동시/재시작/기간 경계/장애 및 개인·공유 rollback·DB CHECK/음수 방어).
- Expo 브라우저: 휴대폰·태블릿 10건 통과(등록·복구·검색·계정 변경·고정 저장 지도·위치 복귀).
- Expo QA 웹 export와 QA를 끈 HTTPS 예시 origin의 iOS/Android Hermes 번들 생성 성공. 예시 origin에 실제 요청하지 않았다.
- 운영 사전검사: 로컬 설정의 cloud 기준 오류를 차단. 순수 설정 테스트와 서버 register 호출에서 비밀값 없는 실패를 검증.
- Canvas 타입 검사와 신규 안내 화면/디자인 파일 확인.

개인 쿼리 namespace와 계정 경계 재마운트까지 반영한 최종본에서 웹 58건·앱 10건을 다시 통과했다. [최종 검증 기록](2026-11-17-validation.json)에 범위와 미검증 항목을 저장했다. 실제 Google/Cloud/실기기는 미검증이며 이 숫자에 포함하지 않는다.

## 7. 인수 문서와 다음 실행

[배포 운영 가이드](../deployment/README.md)에 로컬/Cloud 차이, 환경변수·HTTPS·키·migration·복원·Vercel/Node 실행·출시 수용 기준을 정리했다. 설정 점검 명령은 읽기 전용이다.

```bash
npm run check:deployment
npm run check:deployment:production # --production: 운영 설정 오류는 실패
npm run check:mobile-release
```

새 CI 서비스, 자동 배포, 유료 계정, 실제 migration 실행은 추가하지 않았다. 이번 변경은 기능별 커밋으로 남기고 작업 브랜치에만 푸시한다. main 자동 병합과 배포는 수행하지 않는다.

## 공식 근거

- [Next production checklist](https://nextjs.org/docs/app/guides/production-checklist), 설치 버전 로컬 headers/environment/instrumentation 문서: 실제 런타임 권한 검사, 환경 분리·CSP·실행 검증 기준.
- [Next 공개 권고의 예](https://github.com/advisories/GHSA-673q-mjm6-r5xr): package 버전 영향과 앱에서 실제 쓰는 기능을 구분했다.
- [DeepmergeTS 권고](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [minimatch 권고](https://github.com/advisories/GHSA-g3hv-75wg-m249): 잔여 도구 취약점 근거.
- [Prisma v7 변경 가이드](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7): 메이저 변경을 자동 강제하지 않은 이유. 저장소 Prisma 6의 migration 명령은 설치 CLI와 기존 migration을 기준으로 확인했다.
- [Better Auth 보안](https://better-auth.com/docs/reference/security): 해시·세션·CSRF/신뢰 origin 기준. 실제 구현 판단은 설치 버전 코드와 테스트를 대조했다.
- Google 정책·비용·키 제한 근거는 해당 절에 연결했다. 문서는 2026-11-17 확인했으며 이후 배포 시 변경 여부를 다시 확인한다.

## 기능별 커밋

- `c4b6663` — 의존성 보안 수정, 운영 설정 가드·검사, 기본 보안 헤더.
- `da3132d` — 원자적 한도 예약, 요청 제한, 개인 응답 no-store와 DB/제품 회귀.
- `2d9a804` — 계정 쿼리 격리, 인증 공통 지도, 새 안내 화면·디자인·회귀.
- 종합 보고서·운영 가이드·PM 명세와 디자인 인수 증거는 후속 문서 커밋으로 기록한다. 모든 커밋은 작업 브랜치에 있으며 main 병합·배포를 수행하지 않았다.
