# Problem

현재 `/api/restaurants`는 검색어와 카테고리 조건을 서버에서 처리하지만, 지도 영역은 아직 조회 조건에 포함하지 않는다. 실제 데이터가 늘어나면 사용자가 보고 있지 않은 지역의 맛집까지 가져오게 되어 전송량, DB 조회 비용, 마커 렌더링 비용이 커진다.

# Why

지도 기반 맛집 탐색에서는 “현재 보고 있는 화면 안의 결과”가 가장 중요한 컨텍스트다. bounds 기반 조회를 도입하면 사용자의 지도 이동과 확대/축소에 맞춰 필요한 맛집만 가져올 수 있고, 이후 Google Places 후보 검색도 같은 viewport 계약 위에서 확장할 수 있다.

# Decision

- `/api/restaurants`에 `north`, `south`, `east`, `west` query parameter를 추가한다.
- bounds가 전달되면 위도/경도 조건으로 현재 지도 영역 내부 맛집만 조회한다.
- 한국 지역 MVP에서는 날짜변경선 crossing은 고려하지 않고 `west <= longitude <= east` 조건을 사용한다.
- 너무 넓은 영역 조회를 막기 위해 서버에서 `take` limit을 둔다.
- 지도 이동 중에는 요청하지 않고, 지도 idle 또는 이동 완료 이벤트 이후 bounds를 갱신한다.
- React Query query key에는 검색어, 카테고리, bounds를 함께 포함한다.
- 카테고리 목록은 전체 기준으로 유지하되, 현재 bounds 내부 결과 수인 `boundsCount`를 함께 제공한다.
- `boundsCount === 0`인 카테고리는 disabled 처리하지 않고 흐리게 표시한다.
- 선택된 카테고리는 현재 bounds 안에 결과가 없어도 유지한다.

# Implementation

맛집 조회 API:

```text
GET /api/restaurants?north=&south=&east=&west=&search=&category=
```

Prisma 조회 조건:

```text
latitude <= north
latitude >= south
longitude <= east
longitude >= west
```

카테고리 옵션 API:

```text
GET /api/restaurant-categories?north=&south=&east=&west=&search=
```

응답 형태:

```ts
interface RestaurantCategoryOption {
  name: string;
  totalCount: number;
  boundsCount: number;
}
```

UI 정책:

- `boundsCount > 0`: 일반 표시
- `boundsCount === 0`: 선택 가능하지만 흐리게 표시
- 선택된 카테고리의 `boundsCount === 0`: 선택 상태 유지, 결과 없음 안내 표시
- 결과 없음 안내 문구: “현재 지도 영역에 해당 카테고리 맛집이 없습니다. 지도를 이동하거나 필터를 초기화해보세요.”

# Result

- 지도 마커는 현재 viewport 안의 맛집만 표시한다.
- 카테고리 버튼 목록은 안정적으로 유지된다.
- 사용자는 특정 카테고리를 선택한 채 지도를 이동하며 해당 맛집을 찾을 수 있다.
- 실제 Places 후보 검색도 같은 bounds 기반 요청 모델로 확장할 수 있다.

# Retrospective

- bounds 변경 요청이 잦아지면 debounce, stale time, 이전 데이터 유지 전략을 조정한다.
- 카테고리 count query가 무거워지면 집계 전용 endpoint 캐싱을 고려한다.
- 데이터가 더 늘어나면 marker clustering 또는 viewport 내 최대 결과 수 안내가 필요하다.
