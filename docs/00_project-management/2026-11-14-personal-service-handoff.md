# 개인용 맛집 보관 서비스 인수인계

개발 기준: `docs/product/personal-service-spec-v1.md`. 승인한 개인 서비스 범위를 웹/PWA/Expo에 구현했다. 배포와 main 병합, 실제 Google 키를 사용하는 호출은 하지 않았다.

## 실행과 첫 계정

실제 저장소: `/Users/jinseongpark/Documents/_git/food-map`.

1. Node 24 사용. 기존 로컬 PostgreSQL/Prisma dev DB를 켠다.
2. `npm install`, `npm run db:generate`, `npm run dev`.
3. `http://localhost:3000/setup`에서 계정을 만든다. 현재 로컬 `.env`에 생성해 둔 `PERSONAL_SETUP_TOKEN` 값을 설정 토큰 필드에 입력하고 원하는 아이디/비밀번호(12자 이상)를 정한다. 비밀을 채팅이나 Git에 올리지 않는다.
4. 기존 자료를 내 계정으로 옮기려면 최초 설정에서 가져오기 체크. 체크하지 않으면 격리 보존한다. 자동으로 기존 자료를 내 계정에 할당하지 않는다.
5. `/login` → `/map`, `/saved`, `/categories`. 최초 계정은 OPERATOR이며 `/admin/api-usage`도 이용할 수 있다. 공개 회원가입은 없다.
6. 스키마 변경 전부터 켜진 개발 서버는 한 번 재시작해 새 Prisma Client를 읽도록 한다.

인증 비밀과 최초 설정 토큰은 현재 로컬 `.env`에만 생성했다. 계정/비밀번호는 임의 생성하지 않았다. 새 환경은 `env.example`을 참고한다. 기존 관리자 접근 키는 더 이상 로그인 수단이 아니다.

## 구현 범위

- 아이디/비밀번호 로그인, 8시간 서버 세션, 로그아웃 세션 폐기, CSRF, 로그인 실패 제한.
- 웹 HttpOnly 쿠키, 앱 SecureStore 토큰. 개인 API의 ownerId 조건과 DB 복합 FK.
- 검색어: 지역·상호 자유 입력 + 음식 종류 + 대표 메뉴. 검색 버튼으로만 외부 계약 호출. Google restaurant 유형 조건 적용.
- 목적/음식 종류/대표 메뉴를 사용자 지정. 저장 시 세 그룹 합쳐 최소 하나. 기존 미분류 자료 보존, 다음 저장에서 정상 분류 필요.
- 내 목록 이름 부분 검색, 같은 그룹 OR/다른 그룹 AND, 12개 페이지, 수정 버전 충돌, 안전한 삭제.
- 현재 페이지 복수 지도 핀, 카드/핀 선택 연결, 현재 위치. 모의 지도 명시. 실제 Google 지도 SDK는 live에서만 로드.
- 모의/실제, 검색/상세, 전역/사용자, 일/월 집계 분리. 예약 후 호출, 실패 환불 없음. 한도 초과 팝업/갱신 시각. 실제 호출은 예전 한도 해제 플래그를 무시.
- 개인 운영자 사용량 대시보드. Cloud Monitoring은 기본 연결하지 않음.

## 데이터와 안전한 이전

기존 public 자료 1맛집, 6카테고리, 0연결을 `/private/tmp/food-map-before-personal-1794583346689.json`에 0600 권한으로 백업하고 신규 마이그레이션 적용. 실제 사용자 자료는 삭제하지 않았다. 별도 테스트에서는 연결된 기존 자료도 보존/가져오기를 검증했다.

Local Prisma dev 엔진의 search_path 문제로 표준 migrate deploy 첫 시도가 실패했다. `npm run db:migrate:local`은 public 경로를 초기화한 로컬 직접 연결로 표준 마이그레이션을 실행한다. 원인과 검증은 troubleshooting 문서 참고.

## MSW 기준

`docs/testing/mock-strategy.md`와 `tests/mocks/google-handlers.ts`, `tests/unit/msw-google-contract.test.ts`를 기준으로 한다. 외부 Google HTTP만 MSW/제공자 mock으로 대체한다. 인증·권한·저장·한도는 실제 로컬 서버와 별도 DB 스키마로 검증한다. 키가 없어도 전체 개발과 테스트가 가능하다. PWA 서비스워커와 MSW 워커를 중복 등록하지 않는다.

## 검증

- ESLint, TypeScript, Next 프로덕션 빌드.
- 단위/계약 21건, 실제 DB 마이그레이션·예산 경쟁 1건.
- 실제 서버의 데스크톱/모바일 제품 검증 14건: 계정 격리, 쿠키/Bearer, 세션 폐기, CSRF, 최초 계정 생성 경쟁, 기존 자료 가져오기, 복수 핀, 필터, 동시 한도 차단과 팝업.
- Expo 실제 컴포넌트의 브라우저 렌더러 휴대폰/태블릿 2건. 인증과 저장은 실제 서버 사용.
- Expo Doctor 20/20, iOS·Android Hermes 번들 및 웹 QA 번들 생성. `apps/mobile/dist`는 설치 파일(IPA/APK)이 아니다.

명령: `npm test`, `npm run test:integration`, `npm run test:product`, `npm run mobile:qa:export`, `npm run test:mobile-ui`, `npm run verify:mobile`. 제품/앱 테스트 러너는 자체 테스트 스키마를 만들고 정리한다. 동시에 여러 제품 테스트 러너를 켜지 않는다(고정 테스트 포트/환경 파일 사용).

기존 `tests/e2e`의 공용 목록 계약은 역사 자료이며 현재 `test:e2e`는 개인 서비스의 실제 제품 테스트로 연결했다.

## 디자인과 근거

기존 확정 메인 시안을 재사용했다. 새 개인 계정 설계/HTML과 개인 검색·지도 설계는 `디자인/수정중/{웹,앱}/05_개인계정`, `06_개인검색과지도`. 사용자 디자인 승인과 구분해 수정 중 상태로 유지한다. 실제 캡처는 `docs/screenshots/personal-*`.

## 남은 연결과 한계

배포·앱스토어 제출·OAuth·공개 가입·공유 기능은 범위 밖. 실제 iOS/Android 기기 및 시뮬레이터는 이 환경에 준비되지 않아 실기기 동작을 검증하지 않았다. 비밀번호 복구 도구는 추가 시도에 대한 자동 승인 검토가 현재 범위를 벗어난 인증 상태 변경으로 거절하여 포함하지 않았다.

기본 모의 모드는 실제 유료 API를 호출하지 않는다. 내부 예약 카운터는 Google의 청구 잔여량이 아니다. 실제 Maps JS 로드는 검색/상세 카운터와 별도이며, live 연결 전 Cloud SKU 쿼터와 키 제한을 확인해야 한다. 실제 연결은 이번에 수행하지 않았다.

## Git

기능별 연속 브랜치: personal-01-msw-contracts → personal-02-auth-ownership → personal-03-web-search-map → personal-04-expo-account → personal-05-usage-dashboard → personal-06-product-verification. 각 브랜치가 직전 브랜치를 포함한다. 최종 결과는 마지막 브랜치에서 확인한다. 커밋 목록으로 변경 범위를 확인할 수 있다. main은 병합하지 않는다.

커밋: `8164037` MSW 기본 모드 → `33cd486` 계정·소유권 → `6e6c94f` 웹 검색·지도 → `611ac8b` Expo 계정 → `dcd6d25` 운영자 사용량. 마지막 검증 커밋은 Git 로그에서 확인한다.
