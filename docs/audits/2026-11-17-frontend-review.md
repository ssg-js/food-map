# 프론트엔드 배포 준비 감사 · 2026-11-17

대상은 Next 웹/PWA, Expo 네이티브·웹 렌더러, 공통 `packages/registration` 클라이언트다. 서버 권한·DB·쿼터·클라우드 구성과 의존성 감사는 별도 보고서에서 종합한다. 실제 배포·Google 유료 API 호출·iOS/Android 실기기 실행은 하지 않았다. 이 보고서는 배포 인증이나 침투 테스트 완료를 의미하지 않는다.

## 검토 방법과 범위

- 페이지와 레이아웃, 인증/복구/계정보안, 등록/저장/분류, 지도 로더/마커/프레임 메시지, API DTO, PWA 캐시, 네이티브 보안 저장소, 공개 설정과 앱 manifest를 읽었다.
- React 코드의 HTML 삽입·일반 저장소·로그·HTTP·외부 링크 사용처를 검색하고 라우트 진입점에서 정적 import 그래프를 추적했다. 프레임 메시지는 origin/source 또는 네이티브 문서 origin/path와 DTO를 검증하는지 확인했다.
- 기존 `personal-service-spec-v1.md`, 지도/복구 ADR·기능·트러블슈팅과 디자인 문서를 비교했다. 신규 안내 페이지는 `디자인/수정중/{웹,앱}/10_서비스안내` 설계 후 구현했다.
- 정적 도달성은 동적 로딩·외부 호출을 완전히 증명하는 도구가 아니므로 제거 후보를 바로 삭제하지 않았다. 사용처 재검색으로 사실을 보강했다.

## 확인한 문제와 조치

### FE-01 · 높음 · 릴리스 앱의 잘못된 API 주소와 평문 외부 전송

이전 `apps/mobile/src/shared/api.ts`는 배포 번들에서도 API URL이 없으면 로컬 HTTP로 연결했고 임의 HTTP 주소를 허용했다. 비밀번호·Bearer 토큰을 잘못된 서버/평문 채널에 보낼 수 있는 설정 위험이었다.

`apps/mobile/src/shared/api-origin.ts`의 `resolveApiOrigin`으로 미설정 릴리스 fallback과 외부 HTTP를 거부했다. 주소의 사용자정보·경로·쿼리·해시도 거부하고 origin만 사용한다. 사설 LAN HTTP는 개발 모드에서만 허용한다. 릴리스에서는 loopback·에뮬레이터 HTTP도 거부한다. 분리된 웹 UI QA에서만 `EXPO_PUBLIC_LOCAL_QA=true`와 web 플랫폼을 함께 명시해 loopback HTTP를 허용한다. 이 QA 플래그를 실제 배포 번들에 넣으면 안 되며 별도 릴리스 검증에서도 HTTPS 공개 origin을 요구한다. `apps/mobile/env.example`에 구분을 기록했다.

증거: `tests/unit/frontend-readiness.test.ts`의 잘못된 공개 HTTP·누락·인증정보 포함 URL 거부와 개발 URL 허용.

### FE-02 · 높음 · 익명 지도 프레임이 유료 지도 SDK를 초기화할 수 있음

이전 `/map-search`, `/map-preview`는 로그인 없이 렌더되었다. 개인 API는 보호되어도 지도 문서의 반복 접근으로 별도 Google 지도 로드 비용이 발생할 여지가 있었다.

두 서버 페이지에서 `requirePageUser()`를 호출한다. 네이티브 `MapFrame.tsx`는 요청 헤더로 `sessionHeaders()`를 전달하며 토큰을 URL에 넣지 않는다. 웹 iframe은 같은 origin의 HttpOnly 쿠키로 인증한다. 네이티브 프레임은 허용 origin·`/map-search` 경로 외 문서 이동과 메시지를 거부한다. 공개 프레임의 client SessionGuard 예외는 유지한다. 초기 Bearer 요청 이후 프레임 JavaScript의 쿠키 없는 별도 세션 요청이 정상 네이티브 문서를 잘못 로그아웃시키지 않도록 서버 가드가 인증 경계다.

추가한 증거: 제품 테스트의 익명 307·인증 Bearer 200·문서에 토큰 미포함, 앱 iframe 인증 회귀. 실제 네이티브 WebView 헤더 동작은 공식 API 문서와 타입으로 확인했으며 실기기 증명은 배포 전 필요하다.

### FE-03 · 중간 · 저장 지도 좌표 URL 노출과 불필요한 문서 재로드

기존 Expo 저장 미리보기는 `?lat=...&lng=...&points=...`와 `key={uri}`를 사용했다. 좌표가 서버 접근 로그에 남을 수 있고 선택·현재 위치 요청 시 지도 문서를 다시 불러와 Maps 초기화가 증가했다.

검색·저장 미리보기의 공통 `MapFrame(.web).tsx`를 추출했다. URL은 고정 `/map-search`이고 위치·선택·장소 배열은 검증된 메시지로만 전달한다. `usePreviewMap`은 카메라와 사용자 GPS를 분리하며 같은 좌표 재요청도 중심 이동 버전으로 전달한다. 지도 프레임은 선택·GPS 요청마다 재마운트하지 않는다. 기존 `/map-preview`는 인증된 호환 경로로 남아 있지만 제품 앱은 더 이상 좌표 URL을 생성하지 않는다.

추가한 증거: Expo UI 테스트에서 저장 fixture 2개 준비 → 선택 변경 → GPS 복귀, `src` 쿼리 없음·frame navigation 0·사용자 점과 음식점 핀 공존을 검사한다.

### FE-04 · 중간 · 저장소 차단이 성공한 로그아웃을 중단

웹 로그아웃·비밀번호 변경은 세션 폐기 후 `localStorage.setItem()` 예외가 발생하면 화면 이동/후속 처리를 중단했다. 사생활 보호 모드·저장소 정책 등에서 이미 무효화된 화면이 남을 수 있었다.

`src/features/auth/model/session-change.ts`의 best-effort 알림으로 바꿨다. 저장하는 값은 비밀이 아닌 시각뿐이다. 다른 탭은 알림을 못 받아도 focus/pageshow 시 세션을 재검증한다. 저장소 오류가 로그아웃 성공 처리를 가로막지 않는다.

증거: 저장소 getter를 실패시킨 단위 테스트, 성공 로그아웃 후 `/login` 이동을 검증하는 제품 테스트.

### FE-05 · 중간 · 계정 API가 무기한 대기하거나 프록시 HTML을 그대로 JSON 처리

계정 보안/복구 factory는 타임아웃이 없었고 HTML 502·잘못된 성공 응답에서 JSON 오류 또는 잘못된 화면 상태가 발생할 수 있었다. 로그인/초기 설정도 요청 대기 제한이 없었다.

계정 요청과 로그인/초기 설정에 20초 AbortController 제한을 적용했다. 계정 API는 no-store, 비JSON 실패 안내, 상태/아이디/복구 키/변경 완료 DTO를 검증한다. 복구 키 원문을 일반 저장소·URL·로그에 기록하지 않는다.

증거: HTML 오류·malformed DTO·20초 취소 단위 테스트. 실제 복구와 변경 흐름은 기존 제품/Expo 회귀에서 함께 확인한다.

### FE-06 · 중간 · 계정 전환 시 화면 메모리 일관성 보완

Expo의 foreground 검증은 세션 없음만 처리하고 다른 사용자 id를 무시했으며 SecureStore의 만료 토큰을 지우지 않았다. 웹 SessionGuard의 이전 사용자 id는 경로마다 초기화됐다.

Expo는 검증된 세션 없음/소유자 변경 시 토큰·QueryClient·개인 화면을 정리하고 다시 로그인하게 한다. 네이티브 보안 저장소 삭제 실패와 상관없이 화면과 메모리 토큰을 먼저 정리한다. 검증 버전으로 늦은 응답이 로그아웃·다른 로그인에 반영되지 않게 했다. 웹은 이전 사용자 id를 ref로 유지한다. 최종 PM 교차 검토에서 FR-AUTH-02의 계정별 query key 요구가 빠져 있음을 확인해 보완했다. `personalQueryKeys`의 `[personal, ownerId, ...]` 네임스페이스를 웹/앱의 카테고리·목록/필터·장소 상세·세션 쿼리와 등록 mutation에 적용했다. 서버 보호 페이지의 검증된 user.id 및 앱 AuthGate context의 ownerId를 전달하며 setQueryData와 invalidation도 같은 소유자 범위만 사용한다. 서버 개인 화면과 네이티브 AuthGate context 경계는 계정 id를 React key로 사용해 지역 상태도 초기화한다. 기존 로그아웃 clear·전경 검사·화면 unmount도 추가 방어로 유지한다.

추가한 증거: Expo foreground 응답을 다른 소유자 DTO로 바꿔 이전 개인 화면이 사라지는 브라우저 UI 회귀. 실제 QueryClient 단위 테스트로 동일 필터·동일 Place ID의 A/B 캐시 분리, A 범위의 수정/무효화가 B에 영향을 주지 않음, 이전 계정의 늦은 응답이 다음 계정 캐시를 덮지 않음을 검증한다. 실제 서버 계정 격리는 서버 A/B 권한 테스트가 담당한다. 이 UI 테스트를 서버 권한 우회 검증으로 해석하지 않는다.

### FE-07 · 중간 · 검색 결과 공급자 귀속과 공개 안내 누락

서버는 `attributions`를 반환했지만 새 검색 후보는 제3자 제공자 정보를 렌더하지 않았다. 공개 이용·데이터 안내 페이지도 없었다.

웹/앱 검색 후보에 제공자 문구와 HTTPS 링크를 표시한다. 링크는 선택 버튼 밖에 두어 중첩 버튼/링크를 피했다. Google Maps 텍스트는 14px·일반 굵기·읽을 수 있는 색상을 사용하고 웹은 `translate=no`를 적용했다. SDK 자체 귀속을 가리지 않는다.

디자인 저장 후 `/terms`, `/privacy`를 만들고 로그인/초기 설정/복구 및 서비스 공통 위치, 네이티브 신뢰 API origin에 진입 링크를 제공했다. 개인용 metadata, 지도 컨트롤/설치 링크의 44px 영역도 보완했다. 작은 마커 시각 크기는 유지하고 투명 hit area를 확장한다.

운영자·연락처·인프라/처리 장소·보관/파기 기간·계정 삭제 요청 경로는 임의 생성하지 않았다. 안내는 코드 사실을 적은 **운영 전 검토 초안**이며 최종 법적 고지가 완료됐다는 뜻이 아니다. 실제 운영 정보 확정이 배포 게이트다.

추가한 증거: 미인증 공개 페이지 200·상호 링크·가로 넘침 없음, 실제 반환된 제공자 표시·HTTPS 링크·javascript 링크 미생성 제품 회귀.

## 낭비·중복 분석

### 현재 사용하지 않는 경로의 제거 후보

감사 시작 시 TS/TSX 141개와 페이지/API 진입 35개를 대상으로 한 정적 import 탐색에서 아래 컴포넌트/훅/API 파일 18개가 제품 진입점에 도달하지 않았다. 정확한 번들 비용 측정이 아니며 이 파일들이 브라우저로 모두 내려간다고 주장하지 않는다.

- `src/features/admin/components/AdminLogin.tsx`: 과거 관리자 키 UI. 현재 운영자 계정 흐름에서 호출하지 않는다.
- `src/features/map/components/{MapView,MapCurrentLocationButton,UserLocationMarker}.tsx`, `src/features/map/hooks/{useContainerSize,useCurrentLocation}.ts`: 과거 지도 화면 묶음. 현재 실제 페이지는 `SelectedPlaceMap`·`GooglePointMap`을 쓴다.
- `src/widgets/map/{hooks/use-map,model/map-context,ui/map-container,ui/map-provider}`: 과거 Provider 컴포지션. `GoogleMapProvider`와 공통 model 자체는 현재도 사용하므로 폴더 전체 삭제는 잘못된 정리다.
- `src/features/place-registration/api/{create-category,fetch-categories,save-restaurant,search-places}.ts`와 `hooks/{useCategories,useCreateCategory,usePlaceSearch,useSaveRestaurant}.ts`: 공통 registration package로 대체된 구형 클라이언트. 특히 구형 검색은 현재 필수 viewport 계약도 전달하지 않으므로 재사용하면 안 된다.

대량 삭제 대신 제거 후보와 현재 대체 경로를 명시했다. 삭제 시 해당 자원 테스트·공개 export·문서 참조도 함께 정리하는 별도 기능 단위가 적절하다. 구형 파일을 수정해도 현재 제품에 적용되지 않을 수 있으므로 유지보수 혼동이 주된 비용이다.

### 실제 정리한 중복과 의존성

- 두 플랫폼 검색/저장 지도에서 프레임 인증·메시지·로드 처리를 `MapFrame`으로 공유하고 저장 미리보기 UI도 `PlaceMapPreview`로 통합했다. URL 상태와 재마운트에 따른 실행 낭비를 제거했다.
- 소스에서 `react-native-maps` import는 없고 app.config의 선택 Android 키 plugin만 남아 있었다. 사용하지 않는 plugin과 예제 키를 제거했고 의존성 삭제는 상위 통합 작업에서 수행한다. 실제 지도는 Google Maps JavaScript SDK WebView를 사용한다. 정확한 APK/IPA 크기 감소는 실기기 빌드로 측정하지 않았다.
- 저장 카드와 부모 `useQueries`는 같은 queryKey로 같은 장소를 관찰하므로 TanStack Query가 요청을 공유한다. 중복 observer가 있다는 이유만으로 API를 이중 호출한다고 판정하지 않았다.

## 남은 배포 전·후 작업

- 운영자와 최종 안내/보관·삭제 요청 정책 확정, 실제 도메인 HTTPS·쿠키·Google referrer 및 API 제한 확인, 클라우드 쿼터 설정은 별도 운영 게이트다.
- 네이티브 bundle/package 식별자는 아직 `.development`이고 iOS local networking 설정이 있다. 실제 릴리스 식별자·서명·store privacy/location 선언과 HTTPS 서버 연결을 실제 iOS/Android 기기에서 확인해야 한다.
- `load-google-maps.ts`는 실패한 singleton Promise를 자동 재설정하지 않는다. 일시 SDK 장애 후 재시도는 현재 문서 새로고침이 필요하다. 친절한 재시도 UI와 로더 복원성은 후속 개선 항목이다.
- 서버가 내리는 모든 외부 Place DTO의 중첩 필드 검증은 추가 강화 여지가 있다. 현재 app bridge는 좌표를 검증하지만 웹 API의 `isPlace`는 필수 문자열 중심이다. 오염된 외부 응답에 대한 장애 복원성 개선 대상이며 정상 데이터에서 확인된 서버 권한 우회는 아니다.
- 기간별 데이터 보관/삭제 자동화, 키 없는 상태와 실제 공급자 장애를 포함한 실기기 접근성·성능 측정은 확장 단계에서 별도 범위를 잡는다.

## 검증 상태

직접 실행: 웹 lint/typecheck, 앱 lint/typecheck 모두 통과. 마지막 전체 단위 실행은 다른 감사 작업 및 계정별 캐시 회귀를 포함해 50건 통과했다. 신규 프론트 단위 8건은 API origin·저장소 차단·계정 DTO/HTML 오류·timeout 및 계정 namespace 분리를 검증한다.

새 제품·Expo UI 테스트는 추가 완료했고 최종 서버/QA DB 실행은 상위 통합 감사에서 수행한다. 통합 결과는 최종 감사 보고서의 실제 실행 기록을 기준으로 갱신한다. Google 실제 호출·배포·실기기 검증은 이 단계에서 하지 않았다.

## 공식 근거

- Expo SDK 58 SecureStore: https://docs.expo.dev/versions/v58.0.0/sdk/securestore/
- React Native Linking: https://reactnative.dev/docs/linking
- React Native WebView source headers와 navigation/message API: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md
- Places API 정책·공개 안내·귀속: https://developers.google.com/maps/documentation/places/web-service/policies
- Next 로컬 문서의 use-client·Layouts and Pages 지침을 구현 전 읽었다.

## 최종 PM 교차 검토 보완 · 2026-11-18

FR-AUTH-02의 계정별 query key는 확장 단계 항목이 아니라 현재 필수 요구다. 이전 검토에서 캐시 clear만으로 충족했다고 분류한 부분을 바로잡고 실제 소유자 namespace를 구현했다. `tests/unit/personal-query-keys.test.ts` 4건을 추가했으며 웹/앱 계정 전환·제품 흐름은 변경 후 통합 검증을 다시 수행한다. 기존 구형 미사용 훅은 현재 제품의 쿼리 경로가 아니므로 삭제 후보 목록에 남긴다.

## 통합 검증 확정 · 2026-11-18
최종 개인 query namespace를 포함한 단위 50건, 웹 제품 58건, Expo 브라우저 UI 10건, DB 통합 시나리오 1건 통과. 웹/앱 lint·TypeScript, Next 빌드, QA 웹 export 및 QA를 끈 iOS/Android Hermes export 성공. 실제 기기·클라우드·Google live·최종 운영 고지는 검증 범위 밖이다. 상세 증거는 `2026-11-17-validation.json` 및 종합 보고서를 기준으로 한다.
