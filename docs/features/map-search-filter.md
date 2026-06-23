# Problem

MVP 1에서는 사용자가 지도에서 mock 맛집 마커를 확인하고 바텀시트로 요약 정보를 볼 수 있었다. 하지만 맛집 수가 늘어나면 사용자가 원하는 맛집을 빠르게 찾기 어렵다.

# Why

지도 탐색 경험은 위치뿐 아니라 사용자가 의도를 좁히는 과정이 중요하다. 검색어와 카테고리 필터는 서버 검색이나 Google Places API 없이도 MVP 단계에서 탐색 UX를 검증할 수 있는 가장 작은 단위다.

# Decision

- 기존 `/api/restaurants` + React Query 데이터 흐름은 유지한다.
- 검색어와 카테고리 필터는 서버 상태가 아니므로 `MapView`의 클라이언트 UI 상태로 관리한다.
- 맛집 목록 원본은 React Query가 소유하고, 필터링 결과는 derived state로 계산한다.
- 검색 대상은 이름, 주소, 카테고리로 제한한다.
- Google Places API, DB, 서버 검색은 MVP 2 범위에서 제외한다.

# Implementation

- `restaurant-filter.ts`에 검색/카테고리 필터 순수 함수를 추가했다.
- `MapSearchControls`에서 검색 입력창, 카테고리 버튼, 필터 초기화 버튼을 제공한다.
- `MapEmptyState`에서 필터 결과가 없을 때 안내 UI와 초기화 버튼을 제공한다.
- `MapView`는 React Query로 받은 맛집 목록을 필터링한 뒤, 필터링된 결과만 지도 마커로 전달한다.
- 현재 선택된 맛집이 필터 결과에서 제외되면 바텀시트를 닫는다.

# Result

- 사용자는 지도 상단에서 맛집 이름, 주소, 카테고리로 검색할 수 있다.
- 사용자는 카테고리 버튼으로 맛집 마커를 필터링할 수 있다.
- 필터 결과가 없으면 안내 UI가 표시된다.
- 필터 초기화 버튼으로 전체 맛집 마커를 다시 볼 수 있다.

# Retrospective

- 서버 검색이 필요해지면 query key에 검색어와 카테고리를 포함하고 `/api/restaurants`에 query params를 추가한다.
- 카테고리가 많아지면 버튼 목록 대신 드롭다운 또는 bottom sheet 필터 UI를 고려한다.
- 지도 영역 내 검색으로 확장하려면 bounds 기반 서버 요청이 필요하다.
