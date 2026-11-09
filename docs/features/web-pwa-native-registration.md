# Problem

현재 MVP에 맞는 데스크톱·모바일 등록 화면과 설치 가능한 웹앱, 별도 모바일 앱이 필요하다.

# Why

화면마다 검색과 등록 로직을 따로 작성하면 중복 요청, 선택 초기화, 카테고리 처리에 차이가 생긴다. 화면은 플랫폼에 맞게 만들고 동작은 공유해야 한다.

# Decision

승인한 v2 시안의 파란색·흰색·명확한 선택 상태를 적용했다. 웹은 좌측 등록 패널과 우측 지도, 모바일 웹과 앱은 짧은 지도 아래 등록 흐름을 배치한다. 검색 결과는 장소 이름과 주소만 표시한다.

# Implementation

- `packages/registration/src/api.ts`: 기존 3개 endpoint를 호출하고 응답 DTO를 검사한다. 짧은 검색어/카테고리 입력을 검증하며 요청에 타임아웃과 no-store를 사용한다.
- `packages/registration/src/use-registration.ts`: 서버 상태는 TanStack Query, 입력/선택은 React 로컬 상태로 처리한다. 서버 상태를 Zustand에 복제하지 않는다.
- `src/widgets/registration`: Server Component가 웹 화면을 조합한다. SDK가 필요한 지도·등록 컨트롤만 클라이언트다.
- `src/features/place-registration/components`: 단계 표시·후보 행·검색·카테고리·저장 피드백을 구성한다.
- `src/features/pwa`, `src/app/manifest.ts`, `public/sw.js`: 설치 안내와 네트워크 단절 안내를 제공한다. API 응답/Google 콘텐츠는 영구 캐시하지 않는다.
- `apps/mobile/src/app`: Expo Router 진입점. `widgets/registration`에서 네이티브 UI와 공통 컨트롤러를 조합한다.

데이터 흐름: 입력 확정 → 공통 API → 기존 Next Route Handler → 후보 선택 → 카테고리 조회/생성 → googlePlaceId + categoryIds 저장 → 성공 안내. 장소 변경 시 선택 카테고리를 초기화한다. 0개 선택 저장도 유지한다. 생성 중·저장 중에는 다른 후보 선택을 막는다.

# Result

웹·앱에서 같은 MVP 등록 흐름을 사용할 수 있도록 구성했다. 별도 검증 결과와 실행 안내는 `docs/00_project-management/frontend-development-handoff.md`에 기록한다. 서버 Route Handler, Prisma schema, migration은 수정하지 않는다.

# Retrospective

좌표 캐시, 저장한 맛집의 지도 마커, 사용자 인증과 개인 목록은 현재 MVP 밖이다. 향후 서버 계약이 추가되면 공통 패키지를 확장한다. 앱스토어 빌드를 진행할 때에는 패키지 식별자·서명·실기기 지도 키와 HTTPS 서버 주소를 별도 확정해야 한다.
