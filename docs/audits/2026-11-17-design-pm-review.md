# 배포 전 PM·디자인 요구 추적 검토

검토일: 2026-11-17 · 기준 코드: `fd9780c`에서 시작한 배포 준비 작업 브랜치.
대상: 개인용 맛집 보관 지도 웹/PWA/Expo. 공개 가입·공유·OAuth·결제·실제 배포는 이번 검토로 추가하지 않는다.

## 판단

개인 계정, 외부 검색, 수동 저장, 세 그룹 분류, 내 목록, 지도 범위 검색, 별도 현재 위치, 복구 기능은 요구사항과 대응하는 코드·테스트가 있다. 그러나 제품 명세·README·일부 디자인 문서에 공용 관리자 키와 과거 지도 제약이 남아 있어 **어떤 상태를 배포 기준으로 삼을지 혼동하는 문제**가 있었다. 또한 공개 서비스 안내가 시안의 문구에만 존재하고 실제 페이지가 없어 **실제 Google 연결을 공개하기 전 필요한 사용자 안내와 운영 정책 확인이 누락**돼 있었다.

이 검토는 요구 추적과 정적 화면 코드 검토다. 법적 적합성, 클라우드 설정, 실시간 Google 연동 또는 iOS/Android 실기기 동작 완료를 증명하지 않는다. 전체 보안·배포 판정과 이번 수정의 실행 테스트 결과는 통합 감사 보고서를 함께 읽어야 한다.

## 확인 범위와 근거

- `docs/product/personal-service-spec-v1.md`, `docs/product/README.md`: 개인 서비스 목표, FR, 제외 범위와 승인 방식.
- 개인 서비스/viewport 인수인계, 계정 복구·기본 위치·지도 범위·현재 위치 기능 문서와 관련 테스트 목록.
- `디자인/README.md`, `디자인/디자인기준.md`, 확정 02와 수정중 03~08의 설계 문서, 구현 시안과 캡처 경로.
- 웹 AccountForm/AccountSecurityForm, PlaceRegistrationPanel/PlaceCandidateRow/SearchNotice, SavedRestaurants/CategoryManager/ConfirmDialog, AdminDashboard/PwaRuntime와 root metadata.
- 앱 AuthGate/AccountTools, RegistrationScreen/SearchNotice, CatalogScreen/OperatorAccess, 공통 등록 컨트롤러의 해당 화면 데이터 흐름.
- Places API 공식 정책: [Policies and attributions](https://developers.google.com/maps/documentation/places/web-service/policies), 2026-11-17 확인. 공개 약관·처리방침 및 제공자 귀속 요구를 확인했으며 법적 적용의 최종 판단은 별개다.

## 발견 사항과 작업 지시

### DPM-01 · P2 · 명세가 이미 구현한 기능을 미결정·초안으로 표시

초기 `docs/product/README.md`는 개발 미착수 초안을 안내했다. 기능명세 §12는 ‘이번 턴에 개발하지 않는다’, §14는 핀 개수/마지막 분류 삭제/계정 생성 경로를 미결정으로, §15는 User/owner 모델이 없다고 현재형으로 적었다. 계정 복구·비밀번호 확인·viewport·별도 GPS 요구도 기능명세의 기준에 통합되지 않았다.

영향: 후속 개발자가 완료한 소유권 보호를 공용 관리자 키 구조로 되돌리거나, 현재 요구가 미승인이라고 오판할 수 있다.

조치 완료(문서): 승인·이력과 현재 동작을 분리하고 §17에 FR-AUTH-04, FR-MAP-02, FR-MAP-03, FR-RELEASE-01을 추가했다. 이미 구현한 결정은 §14에 명시했다. 역사 자료를 삭제하거나 기능 범위를 확대하지 않았다.

수용 기준: 개인 보관함 수정은 본인 세션/ownerId, 새 검색은 viewport 최대 10개, 저장 목록은 현재 페이지 최대 12개, 최소 정상 분류 1개, 복구 키 방식이 현재 요구로 명확해야 한다.

### DPM-02 · P2 · 디자인·실행 안내의 공용 권한/네이티브 지도 설명 잔존

`디자인/수정중/{웹,앱}/04_저장목록과관리/README.md`는 ‘공용 데이터 수정·삭제는 관리자 권한’을 지시했다. 기존 `README.md`도 ADMIN_ACCESS_KEY 입력과 iOS Apple Maps/Android Maps SDK 키를 안내했지만, 현재 검색 지도는 서버 `/map-search`의 Maps JavaScript를 WebView/iframe으로 사용한다. `디자인/디자인기준.md`의 v2에는 마커 미표시·분류 없이 저장 가능 이력이 있었다.

조치 완료(소유 문서): 04를 개인 소유·세 그룹·안전 삭제로 수정하고 06의 저장 목록 12개와 새 검색 10개를 구분했다. 디자인 기준·index에는 옛 시안의 기록과 후속 기능 기준 우선순위를 표시했다. 사용자 승인 없이 수정중 시안을 확정으로 승격하지 않았다.

다른 담당 지시: 부모 작업자가 README·배포 가이드를 현재 지도/인증 구조에 맞춰 갱신한다. 프론트 담당은 metadata의 ‘함께 쓰는 카테고리’를 개인용 문구로 수정한다.

수용 기준: 새 배포자가 과거 관리자 키나 사용하지 않는 지도 SDK 키를 복사하지 않고 개인 계정과 현재 API URL/지도 키 구성을 따를 수 있어야 한다.

### DPM-03 · P1 · 공개 서비스 안내 부재와 운영 고지 미확정

기존 확정 시안의 생성프롬프트에는 이용약관·개인정보처리방침 링크가 있으나 실제 `/terms`, `/privacy` 경로와 안내 내용이 없었다. 실제 Google Places를 공개 운영할 때 요구되는 공개 문서와 실제 데이터 처리 설명을 시안만으로 대체할 수 없다.

조치 완료(설계): `디자인/수정중/{웹,앱}/10_서비스안내/{README.md,preview.html}`에 구현 전 시안을 저장했다. 프론트 담당에게 공개 200 경로, 로그인 이전 접근, 계정/서비스 내비게이션과 앱 링크, 실제 데이터 처리·Google 조건 연결·운영 미정 항목 구분을 전달했다.

코드 지시: `/terms`, `/privacy`를 정적 공개 문서로 구현한다. 비밀번호/복구 키 해시, Place ID와 사용자 분류, 세션, 단발 위치, Google 검색/SDK 전송과 영속 보관 경계를 사실대로 설명한다. 운영자 이름·연락처·보관 기간을 만들어 넣지 않는다.

배포 전 잔여: 실제 운영자 연락처, 호스팅/처리 장소, 인증·사용량 기록/백업 보관·파기 기간, 계정 삭제 요청 절차와 해당 지역 고지 요구를 확정한다. 정적 안내 페이지를 만들었다는 이유로 모든 법적 고지가 완료됐다고 판단하지 않는다.

### DPM-04 · P2 · 새 검색 결과의 제공자 귀속 렌더와 터치 영역 불일치

기준 코드의 `PlaceCandidateRow.tsx`는 이름·주소만 표시했다. Place DTO에는 `attributions`가 있고 저장 카드(web/app)에는 귀속 링크가 있지만 새 검색 후보에는 동일 렌더가 없었다. 또한 `globals.css`의 모의 지도 컨트롤 40px, 설치 버튼 32px, 음식점 핀 36px은 명세의 44px 핵심 터치 영역 기준보다 작았다.

코드 지시: 프론트 담당에게 웹·앱 새 검색 결과의 제공자 귀속 표시, 링크 프로토콜 제한, Google Maps 텍스트 가독성/스타일을 확인하도록 전달했다. 지도 마커의 시각 크기와 조작 대상의 hit area를 구분해 주요 터치 컨트롤을 보완한다.

수용 기준: 반환된 제3자 귀속이 사라지지 않아야 하고 지도 SDK 기본 귀속을 가리지 않아야 한다. 추가 출처 링크가 후보 선택 버튼 안의 중첩 클릭 대상이 되지 않아야 한다. 같은 그룹 OR·그룹 간 AND, GPS/결과 마커 의미와 viewport 검색 동작은 유지해야 한다.

### DPM-05 · P3 · 성공 화면 밖의 상태와 실기기 인수 증거 분리 필요

기존 문서는 오류/빈 상태와 접근성을 선언했지만 페이지별 인수 조건을 한 곳에서 읽기 어려웠다. 특히 계정 복구 키 미발급/재발급/보관, 세션 만료, Google 상세 실패 시 내 분류 수정, 한도/지도 별도 quota, 409 충돌, 키보드·안전 영역·작은 화면을 함께 확인할 필요가 있다.

조치 완료(설계): 수정중 09_배포전상태점검에 로그인/복구/검색/지도/저장/관리/오프라인·접근성 수용 기준을 저장했다. 새 페이지가 아닌 기존 화면의 인수 조건이다.

잔여 검증: iOS/Android 실기기의 권한 거부/재허용, 키보드·글자 확대·안전 영역, WebView 통신/포커스와 클라우드 HTTPS에서의 PWA/세션을 확인해야 한다. 브라우저 렌더러와 번들 생성은 이를 대신하지 않는다.

## 요구사항 추적

- FR-AUTH-01~03: `src/shared/lib/auth.ts`, `personal-access.ts`, `src/app/api/auth/*`, 웹 SessionGuard/AccountForm, 앱 AuthGate. 검증 근거는 `tests/product/catalog.spec.ts`의 로그인·CSRF·계정 격리와 세션 폐기. 계정 간 query key와 캐시 정리는 프론트 감사 담당에 추가 확인을 요청했다.
- FR-AUTH-04: 웹 AccountSecurityForm/앱 AccountTools, 계정 보안 API와 `tests/product/account-security.spec.ts`.
- FR-SEARCH-01/FR-SAVE-01: 공통 registration API/useRegistration, PlaceRegistrationPanel/앱 RegistrationScreen, search-handler와 restaurants API. API 키 없는 외부 mock과 실제 개인 인증/저장을 구분한다.
- FR-CAT/FR-FIND/FR-LIST/FR-EDIT: SavedRestaurants/CategoryManager/앱 CatalogScreen, personal-catalog와 categories/restaurants API. tests/product/catalog.spec.ts가 소유권·분류 최소 1개·필터·버전 충돌·삭제를 다룬다.
- FR-MAP-01~03: SelectedPlaceMap/GooglePointMap/MockPointMap, SearchMapBridge와 앱 SearchMap/useSearchMap. tests/product/viewport-search.spec.ts, default-location.spec.ts, tests/unit/map-lifecycle.test.ts와 앱 viewport 시나리오.
- FR-EXT/FR-LIMIT: provider/search-handler/personal-budget/search-budget 및 SearchNotice. MSW와 실제 DB 경쟁/실패 차단 검증을 분리한다. 실제 Maps JS 로드/공유 결제 프로젝트를 앱 카운터만으로 보장하지 않는다.
- FR-OPS-01: `/admin/api-usage`와 API 사용량 대시보드. 개인 보관함 관리 권한은 본인 세션이며 운영 역할과 혼동하지 않는다. 네이티브 별도 관리자 앱 페이지는 구현하지 않았고 웹 운영 화면을 기준으로 한다.
- FR-RELEASE-01: 공개 서비스 안내, 환경·의존성·인증·백업·보안 헤더 및 cloud 운영 준비는 통합 배포 감사/운영 가이드와 검증 결과가 최종 근거다.

## 변경 파일과 검증 범위

이 PM 작업에서는 `docs/product/**`, 이 보고서와 `디자인/**`의 명세/시안만 수정했다. 런타임 코드·DB 스키마·운영 데이터·키·배포 설정을 직접 바꾸지 않았다.

문서 점검: 수정 전 문구를 코드·기능 문서와 대조했고, 구현된 요구를 미결정으로 표기한 부분과 공용 권한 설명을 정리했다. 새 10번 시안은 구현 전에 저장해 프론트 담당에 전달했다. 문서와 디자인의 내부 경로/HTML 구조 확인은 수행하며, 코드 린트·빌드·브라우저 회귀는 통합 담당자가 실행한 결과로 기록한다.

## 운영 전 PM 결론

개인용 핵심 기능을 다시 설계하거나 다중 사용자 기능을 늘릴 필요는 없다. 이번에는 명세/디자인의 현재 기준을 정리하고, 공개 안내·귀속·터치 영역과 감사에서 확인한 결함을 기능별로 보완한다. 공개 운영자 고지, 실제 클라우드 보안 설정·백업 복구, 실제 키 제한과 네이티브 실기기 증거가 없는 상태를 ‘배포 준비 완료’로 승격하지 않는다.

## 통합 검증 확정 · 2026-11-18
최종 개인 query namespace를 포함한 단위 50건, 웹 제품 58건, Expo 브라우저 UI 10건, DB 통합 시나리오 1건 통과. 웹/앱 lint·TypeScript, Next 빌드, QA 웹 export 및 QA를 끈 iOS/Android Hermes export 성공. 실제 기기·클라우드·Google live·최종 운영 고지는 검증 범위 밖이다. 상세 증거는 `2026-11-17-validation.json` 및 종합 보고서를 기준으로 한다.
