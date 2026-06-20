# Problem

사용자가 지도에서 주변 맛집을 탐색할 수 있는 MVP 1 기능이 필요했다. 로그인·DB·CRUD 없이 지도 기반 맛집 탐색만 먼저 검증해야 했다.

# Why

맛집 지도 서비스의 핵심 가치는 "위치 기반 탐색"이다. 지도·위치·마커·바텀시트 흐름을 먼저 완성해야 이후 API·상세 페이지·등록 기능을 안전하게 확장할 수 있다.

# Decision

- 지도 SDK는 `widgets/map`의 `IMapProvider` 추상화를 사용하고, MVP에서는 `StubMapProvider`로 UI 흐름을 검증한다.
- 맛집 마커는 React 오버레이(`RestaurantMarker`)로 렌더링한다. SDK 교체 시 어댑터에서 네이티브 마커로 전환할 수 있다.
- Mock 데이터는 `shared/constants/mock-restaurants.ts`에 단일 소스로 관리한다.
- 위치 권한은 `useCurrentLocation` 훅에서 처리하고, 거부 시 기본 좌표(서울 시청)로 폴백한다.

# Implementation

- `/map` 페이지에서 `MapProvider` + `MapView` 조합으로 지도 화면을 구성했다.
- `useCurrentLocation`으로 Geolocation API 권한 요청 및 좌표 획득.
- 획득한 좌표로 `useMapStore.setCenter` 호출하여 지도 중심을 이동.
- `MOCK_RESTAURANTS`를 Web Mercator 기반 픽셀 변환으로 마커 위치에 매핑.
- 마커 클릭 시 `RestaurantBottomSheet`에 이름·카테고리·평점·주소·설명을 표시.

# Result

- 홈(`/`)에서 `/map` 진입 가능.
- 현재 위치 권한 요청 및 지도 중심 이동.
- 5개 mock 맛집 마커 표시 및 바텀시트 요약 정보 표시.
- 상세 페이지 이동은 미구현.

# Retrospective

- Kakao/Naver SDK 어댑터 연동 및 네이티브 마커 전환.
- React Query로 `/api/restaurants` 연동.
- 맛집 상세 페이지 및 마커 클러스터링.
- 위치 권한 재요청 UX 개선.
