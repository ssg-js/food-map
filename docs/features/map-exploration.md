# Problem

사용자가 지도에서 주변 맛집을 탐색할 수 있는 MVP 1 기능이 필요했다. 로그인·DB·CRUD 없이 지도 기반 맛집 탐색만 먼저 검증해야 했다.

# Why

맛집 지도 서비스의 핵심 가치는 "위치 기반 탐색"이다. 지도·위치·마커·바텀시트 흐름을 먼저 완성해야 이후 API·상세 페이지·등록 기능을 안전하게 확장할 수 있다.

# Decision

- 지도 SDK는 `widgets/map`의 `IMapProvider` 추상화를 사용하고, `/map`에서는 `GoogleMapProvider`를 선택한다.
- 맛집 마커는 `MapContainer`의 `markers` prop을 통해 지도 provider에 전달하고, Google Maps 네이티브 마커로 렌더링한다.
- Mock 데이터는 `shared/constants/mock-restaurants.ts`에 단일 소스로 관리하고, 화면에서는 React Query로 `/api/restaurants`를 조회한다.
- 위치 권한은 `useCurrentLocation` 훅에서 처리하고, 거부 시 기본 좌표(서울 시청)로 폴백한다.

# Implementation

- `/map` 페이지에서 `MapProvider` + `MapView` 조합으로 지도 화면을 구성했다.
- `useCurrentLocation`으로 Geolocation API 권한 요청 및 좌표 획득.
- 획득한 좌표로 `useMapStore.setCenter` 호출하여 지도 중심을 이동.
- `useRestaurants`가 React Query로 `/api/restaurants`를 조회하고, 조회 결과를 SDK 독립적인 `Marker` 타입으로 변환해 `MapContainer`에 전달.
- Google Maps JavaScript API는 `/map` 진입 시 클라이언트에서만 lazy load한다.
- Google Maps 초기화 성공/실패 상태를 `MapContainer`에서 `MapView`로 전달해 지도 로딩과 에러 UI를 안정화했다.
- 위치, 지도, 맛집 데이터 상태 배너는 우선순위 기반으로 하나만 표시한다.
- 마커 클릭 시 `selectedRestaurantId`를 저장하고, React Query 데이터에서 선택된 맛집을 derived state로 계산해 `RestaurantBottomSheet`에 이름·카테고리·평점·주소·설명을 표시.

# Result

- 홈(`/`)에서 `/map` 진입 가능.
- 현재 위치 권한 요청 및 지도 중심 이동.
- Google Maps 위에 5개 mock 맛집 마커 표시 및 바텀시트 요약 정보 표시.
- 맛집 목록은 React Query 캐시를 통해 서버 상태로 관리.
- 지도 SDK 로딩 중/실패 상태가 사용자에게 표시된다.
- 상세 페이지 이동은 미구현.

# Retrospective

- Kakao/Naver SDK 어댑터 추가 시 `IMapProvider` 구현체만 교체.
- 맛집 상세 페이지 이동 시 선택 id 기반 라우팅으로 확장.
- 맛집 상세 페이지 및 마커 클러스터링.
- 위치 권한 재요청 UX 개선.
