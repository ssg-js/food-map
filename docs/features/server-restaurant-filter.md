# Problem

MVP 2 검색/필터는 React Query로 전체 맛집 목록을 가져온 뒤 클라이언트에서 derived state로 필터링했다. MVP 3에서 `/api/restaurants`가 DB 조회로 전환되면서, 데이터가 늘어날수록 전체 목록 fetch 후 클라이언트 필터링은 불필요한 전송량과 렌더링 비용을 만든다.

# Why

맛집 지도는 검색어, 카테고리, 지도 bounds 같은 조건으로 결과를 좁혀 탐색하는 서비스다. 서버 query parameter 기반 조회로 전환하면 API contract를 검색/필터 중심으로 확장할 수 있고, 이후 pagination, bounds 검색, 실제 장소 데이터 연동으로 이어가기 쉽다.

# Decision

- `/api/restaurants`에 `search`, `category` query parameter를 추가한다.
- `search`는 이름, 주소, 카테고리에 부분 일치로 적용한다.
- `category`는 정확히 일치하는 카테고리만 조회한다.
- React Query query key에 정규화된 필터 값을 포함한다.
- 검색/필터 UI 상태는 `MapView`의 클라이언트 상태로 유지한다.
- 카테고리 목록과 전체 개수는 기본 맛집 목록 query에서 파생하고, 표시할 마커 목록은 필터 query 결과를 사용한다.

# Implementation

- `src/app/api/restaurants/route.ts`에서 `Request.url`의 query parameter를 읽어 Prisma `where` 조건을 만든다.
- `src/features/map/api/fetch-restaurants.ts`에서 필터 상태를 `/api/restaurants?search=&category=` URL로 변환한다.
- `src/features/map/hooks/useRestaurants.ts`에서 query key에 정규화된 필터를 포함한다.
- `src/features/map/components/MapView.tsx`는 필터 상태를 `useRestaurants(filter)`에 전달하고, 마커는 서버 필터 결과로 렌더링한다.
- 검색어나 카테고리 필터가 바뀌면 이전 선택 상태를 닫아 stale 바텀시트를 방지한다.

# Result

- 검색어와 카테고리 조건이 DB 조회 단계에서 적용된다.
- 기존 `Restaurant[]` 응답 형태는 유지된다.
- 지도 UI는 기존 검색/필터 사용성을 유지하면서 서버 필터 결과를 표시한다.

# Retrospective

- 검색 입력마다 서버 요청이 발생하므로 데이터가 더 늘어나면 debounce 또는 submit 기반 검색을 고려한다.
- 카테고리 목록 전용 endpoint가 생기면 전체 목록 query 없이 필터 옵션만 가볍게 가져올 수 있다.
- 지도 영역 기반 검색으로 확장하려면 bounds query parameter와 좌표 인덱스를 함께 활용한다.
