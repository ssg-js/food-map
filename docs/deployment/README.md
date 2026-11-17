# 개인용 맛집지도 배포 운영 가이드

검토 기준: 2026-11-17~18, Next.js 16.4.6 / Prisma 6.19.3 / Node.js 24 / Expo SDK 58.
이 문서는 **실제 배포 승인·실행 기록이 아니다**. 코드 검증과 클라우드에서 직접 확인해야 하는 조건을 구분한다. 종합 감사는 `docs/audits/2026-11-17-deployment-readiness.md`를 읽는다.

## 1. 로컬 실행과 클라우드의 차이

로컬은 개발 DB·HTTP localhost·개발용 인증 비밀값을 사용할 수 있다. LAN HTTP에서는 위치 권한과 PWA 설치가 제한될 수 있으므로 localhost 또는 개발용 HTTPS를 이용한다. `next dev`와 Expo 개발 서버를 인터넷에 공개하지 않는다.

클라우드는 운영 HTTPS origin·별도 DB·개발과 다른 비밀값·연결 풀·백업·접근 제한이 필요하다. DB 포트와 Next 내부 포트는 인터넷에 직접 공개하지 않는다. 웹과 API는 같은 origin을 기본으로 한다. 실제 웹/PWA는 Next를 배포한다. Expo의 웹 export는 현재 검증 렌더러이며, 다른 도메인에서 직접 띄우면 쿠키·CORS·same-origin iframe 경계가 맞지 않는다. 테스트에서는 같은 origin 로컬 프록시를 사용한다. 이 문제를 풀기 위해 운영 CORS나 프레임 보호를 무조건 완화하지 않는다. Expo 앱은 이 API 서버를 호출하며 API 주소는 빌드 시 공개 번들에 포함된다.

## 2. 설치와 개발

```bash
nvm use # .nvmrc의 Node 24
npm ci # lockfile 재현 설치
npm run db:generate
npm run dev
```

앱은 `npm run mobile:install` 후 `apps/mobile/env.example`을 참고해 개발 API origin을 설정하고 `npm run mobile:start`로 실행한다. 개발 중에는 사설 LAN HTTP가 가능하지만 릴리스는 운영 HTTPS를 사용한다. `react-native-maps`용 별도 키는 사용하지 않는다. 현재 앱 지도는 인증된 서버 지도 프레임을 WebView/iframe으로 표시하는 Maps JavaScript 방식이다.

## 3. 운영 환경변수

루트 `env.example`은 **예시만** 제공한다. 실제 값은 호스팅의 secret/environment 설정에서 관리한다. 파일을 쓰는 서버에서는 소유자 읽기/쓰기 권한으로 제한한다. 운영 로그·오류·스크린샷에 값을 남기지 않는다.

- `DEPLOYMENT_ENV=production`: 운영 시작 검사와 HTTPS 보안 헤더 활성화. Vercel production 환경도 자동 식별한다. Preview는 운영 데이터와 분리한다.
- `DATABASE_URL`: 운영 전용 PostgreSQL. 공급자가 지원하는 TLS(`sslmode=require` 또는 더 엄격한 설정), 인증서, 연결 풀/동시 연결 수를 확인한다. localhost Prisma dev URL을 복사하지 않는다.
- `BETTER_AUTH_SECRET`: 개발과 다른 충분히 긴 무작위 값. 초기 계정 생성에 쓰는 `PERSONAL_SETUP_TOKEN`과 분리한다. 무작위 생성 예시는 `env.example`에 있다.
- `PERSONAL_SETUP_TOKEN`: 최초 개인 계정 생성 시만 안전하게 전달한다. 설정 완료 후 환경에서 제거해도 된다. 계정·복구 키를 안전하게 보관하고 공개 회원가입은 열지 않는다.
- `AUTH_BASE_URL`: 운영의 정확한 `https://서비스도메인` origin. path/query/userinfo 없이 설정한다.
- `AUTH_TRUSTED_ORIGINS`: 허용할 HTTPS origin을 쉼표로 구분. 운영에서는 localhost·와일드카드를 포함하지 않는다.
- `EXTERNAL_API_MODE=mock`: 최초 검증 배포에서 비용을 발생시키지 않는 권장 시작값. 실제 연결 여부를 사용자가 혼동하지 않게 모의 표시를 유지한다.
- live로 바꿀 때 `GOOGLE_PLACES_ENABLED`, 서버용 `GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_BROWSER_ENABLED`, 공개 브라우저용 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 별도로 설정한다. 이 서비스는 검색 결과를 지도에 표시하므로 live 모드에서 실제 지도 설정도 요구한다.
- `API_DAILY_LIMIT`, `API_MONTHLY_LIMIT`: 양의 정수. 현재 live 상한은 일 100/월 4500이다. 이 값은 코드의 보수적 앱 한도이며 제공자의 무료량이나 무과금 보증이 아니다.
- Monitoring은 기본 비활성이다. 나중에 연결할 때만 `GOOGLE_CLOUD_PROJECT`, `GOOGLE_MONITORING_ENABLED=true`, 최소 Monitoring 조회 권한의 서버 인증을 사용한다. 키 파일을 Git·앱 번들에 넣지 않는다.
- 앱 릴리스 `EXPO_PUBLIC_API_URL`: 운영 HTTPS origin. 서버 비밀키를 `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`에 넣지 않는다. 앱 bundleIdentifier/package와 스토어별 권한·서명은 실제 릴리스 준비 시 별도로 확정한다.

`NEXT_PUBLIC_*`는 웹 빌드 시 고정된다. 키·도메인 변경 뒤에는 같은 환경으로 다시 빌드해야 한다. `EXPO_PUBLIC_*`도 앱 export/build 시 고정되므로 단순 서버 재시작으로 바뀌지 않는다.

## 4. 배포 전 검사와 빌드

```bash
npm run check:deployment # 읽기 전용 로컬 설정 검사; 외부 호출/DB 접속 없음
npm run check:deployment:production # --production: 클라우드 설정 오류는 실패 처리
npm run lint
npm run typecheck
npm test
npm run build:production # 설정 검사 → Prisma client 생성 → Next 빌드
npm run check:mobile-release # 앱 API HTTPS 및 QA 모드 해제 검사
npm run mobile:export:production # 앱 설정 검사 → iOS/Android 번들 생성
```

이 CLI는 비밀값 대신 검사 ID와 설명만 출력한다. 현재 로컬 설정이 production 검사에서 실패하는 것은 운영용으로 그대로 복사하면 안 된다는 뜻이다. 통과해도 DB 방화벽·키 제한·정책·백업이 검증됐다는 의미는 아니다. 운영 서버 시작 시에도 instrumentation이 같은 검사를 수행한다.

코드 검증용 DB 테스트는 `npm run test:integration`, `npm run test:product`, `npm run mobile:qa:export` 후 `npm run test:mobile-ui`를 사용한다. 테스트 러너는 **로컬 DB만 허용하고 분리 스키마를 만들고 지운다**. 운영 DATABASE_URL로 실행하지 않는다. 제품 테스트는 인증·DB를 실제 검증하고 Google은 mock으로 바꾼다.

## 5. DB 마이그레이션과 데이터 보호

운영 DB의 백업과 복원 리허설을 먼저 확인한다. 이 저장소는 Prisma **6**을 사용한다. 최신 Prisma 문서의 다른 메이저 명령을 그대로 섞지 않는다.

```bash
npm run db:status # 연결한 DB의 migration 상태 확인
npm run db:deploy # 저장소에 이미 기록된 migration만 적용
```

Prisma CLI는 개발/빌드 도구 의존성으로 분리했다. migration·client 생성 단계에는 devDependencies를 설치한 빌드/관리 환경이 필요하다. `@prisma/client`의 optional peer 때문에 npm에서 devOptional CLI 경로가 남을 수 있다. `--omit=dev`만으로 도구 취약점이 사라진다고 가정하지 말고 실제 배포 artifact를 확인한다.

이 명령은 실제 DB를 변경하므로 승인된 배포 절차에서만 실행한다. 이번 감사에서는 운영 DB에 실행하지 않았다. 연결 풀 URL과 migration용 직접 연결 URL이 다르면, 운영 환경에서 일시적으로 `DATABASE_URL`을 승인된 직접 연결로 주입하여 migration을 실행한다. credential을 명령 인수나 로그에 복사하지 않는다.

운영에서는 `prisma migrate dev`, `db push`, `migrate reset`을 사용하지 않는다. `scripts/migrate-local.mjs`와 `backup-before-personal.mjs`는 과거 로컬 전용 도구다. 특히 과거 JSON 백업은 User/Session/Account/RecoveryKey를 포함하는 전체 복구 백업이 아니다.

관리형 DB의 자동 백업/PITR 또는 암호화된 전체 `pg_dump`를 준비하고, **별도 DB**에서 복원 후 사용자·맛집·카테고리·연결·복구 키 해시·예산이 유지되는지 검사한다. 원본 DB에 복원하지 않는다. 복원 파일·스토리지 접근 권한, 보관·파기 기간과 담당자를 기록한다. 이번 환경에는 pg_dump/pg_restore가 없고 실제 클라우드 복원은 수행하지 않았다.

## 6. Vercel 또는 Node 서버

Vercel을 선택하면 저장소 루트가 Next 프로젝트여야 하며 build 명령은 `npm run build:production`, Node 24, production 환경변수를 설정한다. API는 Node 런타임이며 정적 export 전용 호스팅으로 배포할 수 없다. DB는 같은 지역의 관리형 PostgreSQL과 적절한 연결 풀을 권장한다. migration은 배포마다 여러 서버가 동시에 임의 실행하지 않게 별도 승인 단계에서 실행한다.

직접 관리하는 Node 서버에서는 전용 비특권 사용자로 `npm run start:production`을 실행하고 프로세스 관리자가 재시작·로그 순환을 관리한다. 공개 HTTPS 역방향 프록시 뒤에 두고 내부 포트만 연결한다. 프록시는 허용 도메인만 수락하고 외부에서 받은 forwarding 헤더를 제거·재작성한다. Host 헤더가 실제 외부 서비스 origin과 맞아야 CSRF 검사가 동작한다.

프록시/WAF에서 요청 본문·읽기 시간·연결 수·로그인 반복 요청을 제한한다. 앱 JSON 변경 요청은 실제 스트리밍 바이트 64KiB/10초로 제한하지만 이 검사는 네트워크 단의 연결 폭주나 DDoS를 막지 못한다. 개인 API/RSC 응답을 CDN에서 강제 캐시하지 않는다. 인증 헤더·쿠키·URL query·본문을 수집하는 상세 request logging은 끄거나 제거한다.

기본 CSP는 `base-uri`, `object-src`, `frame-ancestors`, `form-action` 제약이다. 같은 origin iframe을 허용하여 앱 지도를 유지한다. 모든 스크립트 실행을 제한하는 nonce 기반 CSP는 아직 적용하지 않았으며, 향후 Google SDK와 Next hydration을 함께 검증하여 도입한다. 헤더만으로 XSS가 모두 해결됐다고 판단하지 않는다.

## 7. Google live 전환 게이트

[Google 비용 관리](https://developers.google.com/maps/billing-and-pricing/manage-costs)에서 안내하듯 예산 알림과 API quota는 역할이 다르다. 브라우저 지도 로드는 서버 Places 요청 카운터를 통과하지 않는다. 내부 카운터만으로 모든 SKU 비용을 차단할 수 없다.

- 서버 Places 키와 공개 Maps JavaScript 키를 분리하고 각 키에 필요한 API만 허용한다. 브라우저 키는 실제 HTTPS 도메인 referrer로 제한한다. 서버 키는 가능한 고정 egress IP 또는 공급자가 지원하는 안전한 인증 경계를 쓴다.
- 개발·미리보기·운영의 프로젝트/키를 분리하고 불필요한 API를 비활성화한다. quota와 결제 알림을 **사용 SKU별로** 확인한다.
- 현재 월 공유 예산이 운영 DB에 있는지 확인한다. `npm run search:budget -- --status`는 운영 DB 예산을 읽지만 Google에는 요청하지 않는다.
- 예산 초기화는 실제 사용량을 확인한 뒤 운영자가 명시적으로 수행한다. `scripts/search-budget.mjs`는 중복 초기화/카운터 리셋을 허용하지 않는다. 월이 바뀌면 검증된 새 예산이 없을 때 차단한다.
- 실제 지도와 출처 표기를 유지하고 [Places 정책](https://developers.google.com/maps/documentation/places/web-service/policies)에 맞게 공개 `/terms`, `/privacy`의 운영자·연락처·처리 위치·보관 기간 등을 확정한다. 현재 문서는 기술적 처리 안내 초안이다.
- live 키가 설정돼 있다는 사실과 콘솔 제한이 검증됐다는 사실은 다르다. 콘솔 설정은 이번 코드 감사에서 조회/변경하지 않았다.

## 8. 출시 인수 확인

운영 HTTPS에서 로그인·로그아웃·세션 만료·A/B 격리, 403/404, 저장/분류 CRUD와 409 충돌, 지도 프레임 인증, 현재 위치 권한, viewport 재검색, 외부 요청 timeout/429/한도 차단을 확인한다. PWA 재설치/새 버전 업데이트와 오프라인에서 비공개 API가 캐시되지 않는지 확인한다.

앱은 iOS/Android 실기기에서 HTTPS 서버·Bearer WebView 인증·위치 거부/재허용·키보드/안전 영역·백그라운드 복귀를 검증한다. Expo 웹 렌더러와 Hermes 번들 생성은 실기기 검증을 대신하지 않는다. 새 디자인은 수정중 폴더에 있으며 사용자 확정 없이 확정 폴더로 이동시키지 않는다.

## 9. 장애·복구와 운영 기록

- 배포 artifact/커밋 ID와 migration 상태를 남긴다. 이상 시 이전 코드 artifact로 롤백하되 DB migration을 임의 역실행하거나 reset하지 않는다.
- DB/Google 장애에서는 검색을 막는 현재 동작을 유지한다. 카운터 오류 때문에 무제한 외부 호출로 우회하지 않는다.
- 초기 설정 중 프로세스가 종료되어 BootstrapState가 CLAIMED로 남으면 서버를 멈추고 백업한 뒤 User/Account 생성 여부와 실행 중 설정 요청이 없는지 확인한다. 무조건 READY로 바꾸는 자동 복구는 중복 계정 생성 경합을 만들 수 있어 제공하지 않는다.
- 비밀번호·복구 키를 모두 잃은 경우 비밀번호 조회는 불가능하다. 무단 사용자 삭제 대신 별도 운영자 복구 절차와 안전한 백업을 사용한다.
- 로그인 시도·사용량·만료 세션·백업의 보관 기간을 확정한다. 새 로그인 시도 행은 기간 prefix로 제한 청소하지만 과거 해시 행의 일괄 삭제는 이 감사에서 실행하지 않았다.
- Monitoring을 나중에 연결할 때 최대 페이지 수·최대 실행 시간과 서버리스 제한을 맞춘다. 현재 수집 결과는 관측 횟수이며 남은 무료 사용량·확정 청구액이 아니다.

## 10. 아직 자동화하지 않은 것

실제 호스팅 선택·DNS/TLS·비밀값 주입·운영 DB 권한/네트워크·백업 복원·WAF·법적 고지·실기기·Cloud Console 검증은 운영자 확인이 필요하다. 자동 배포/유료 계정/새 CI 인프라는 연결하지 않았다. 기존 로컬 검증 스크립트를 재사용하고, 별도 CI 도입 시 테스트 DB와 mock만 사용하도록 설정한다.

Expo UI 검증 스크립트만 EXPO_PUBLIC_LOCAL_QA=true와 loopback API를 명시한다. 이 QA export를 배포 artifact로 사용하지 않는다. 실제 릴리스는 QA 모드를 해제한 별도 export/build를 만든다.
