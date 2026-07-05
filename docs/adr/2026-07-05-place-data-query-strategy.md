# Context

현재 지도 UI는 클라이언트에서 Google Maps JavaScript API를 로드해 렌더링한다. 맛집 데이터는 우리 `/api/restaurants` Route Handler가 Prisma로 PostgreSQL을 조회해 제공한다.

다음 단계에서는 실제 장소 데이터를 Google Places API로 조회할 수 있어야 한다. 이때 Maps JavaScript API와 Places API의 책임을 분리하지 않으면 API key 노출 범위, 비용 제어, 캐싱 정책, Google Maps Platform 약관 준수, 우리 DB 데이터와 외부 장소 데이터 병합이 어려워진다.

# Options

## Option 1: 클라이언트에서 Maps JavaScript API와 Places API를 모두 호출

- 장점: 브라우저에서 지도 상태와 장소 검색을 직접 연결하기 쉽다.
- 장점: 별도 서버 endpoint 없이 빠르게 프로토타입을 만들 수 있다.
- 단점: Places 호출 정책, rate limit, 비용 제어가 클라이언트에 흩어진다.
- 단점: Google 응답과 우리 DB 데이터를 병합하거나 저장 정책을 통제하기 어렵다.
- 단점: 웹 외 클라이언트가 생기면 장소 조회 로직이 중복된다.

## Option 2: 클라이언트는 지도 UI만 담당하고, 장소/맛집 데이터 조회는 서버가 담당

- 장점: API key 사용 범위와 외부 API 호출 정책을 서버에서 통제할 수 있다.
- 장점: Google Places 결과와 우리 `Restaurant` 데이터를 서버에서 정규화하고 병합할 수 있다.
- 장점: 비용 제어, 캐싱, rate limit, logging을 중앙화할 수 있다.
- 장점: 사용자가 저장한 맛집, 리뷰, 즐겨찾기 같은 서비스 데이터는 PostgreSQL을 source of truth로 유지할 수 있다.
- 단점: 장소 조회용 Route Handler와 DTO 설계가 추가로 필요하다.

## Option 3: Google Places 데이터를 미리 대량 수집해 우리 DB를 구성

- 장점: 런타임 외부 API 의존을 줄일 수 있다.
- 단점: Google Maps Platform 약관과 데이터 저장 제한에 부딪힐 수 있다.
- 단점: 장소 정보 최신성을 유지하기 어렵다.
- 단점: MVP 단계에서 비용과 운영 리스크가 크다.

# Decision

Option 2를 선택한다.

Maps JavaScript API는 클라이언트에서 지도 렌더링, pan/zoom, bounds 계산, 사용자 상호작용 처리에만 사용한다.

Places API와 우리 DB 기반 맛집 조회는 Next.js Route Handler에서 처리한다.

```text
Browser
  ├─ Google Maps JavaScript API로 지도 표시
  └─ bounds/search/category/place query를 우리 API로 요청

Next Route Handler
  ├─ Prisma로 PostgreSQL의 Restaurant 조회
  ├─ 필요 시 Google Places API 호출
  ├─ Google 응답을 앱 전용 DTO로 정규화
  └─ 저장 가능한 서비스 데이터만 PostgreSQL에 기록

PostgreSQL
  └─ 사용자가 저장한 맛집, 리뷰, 즐겨찾기, 메모 등 서비스 데이터 저장
```

Google Places API는 “장소 후보 검색”과 “선택한 장소 상세 조회” 용도로 사용한다. 우리 서비스의 지도 마커와 사용자 기능은 우리 DB의 `Restaurant`를 기준으로 확장한다.

# API Shape

맛집 조회:

```text
GET /api/restaurants?north=&south=&east=&west=&search=&category=
```

장소 후보 검색:

```text
GET /api/place-search?query=&north=&south=&east=&west=
```

장소 상세 조회:

```text
GET /api/places/:placeId
```

맛집 저장:

```text
POST /api/restaurants
```

`POST /api/restaurants`는 사용자가 선택한 Google 장소를 우리 서비스의 `Restaurant`로 저장할 때 사용한다. 저장 필드는 Google Maps Platform 약관과 서비스 요구사항을 함께 검토해 별도로 확정한다.

# Consequences

- 지도 렌더링과 장소 데이터 조회 책임이 분리된다.
- 브라우저는 Google Maps public key를 사용하되, Places 호출 정책은 서버가 관리한다.
- 실제 맛집 마커는 우리 DB의 `Restaurant`를 source of truth로 삼는다.
- Google Places API는 후보 검색과 상세 확인에 사용하고, 대량 수집 기반 DB 구축에는 사용하지 않는다.
- 비용 제어, 캐싱, rate limit, logging을 서버에서 일관되게 적용할 수 있다.
- Places API를 enable하거나 저장 정책을 확정하기 전 별도 구현 PR에서 약관과 과금 조건을 다시 확인한다.

# Verification Plan

- `/map`에서는 Maps JavaScript API가 지도 UI만 담당하는지 확인한다.
- 장소 후보 검색은 서버 Route Handler를 통해서만 호출되도록 한다.
- Places API key는 서버 환경 변수로 관리하고 클라이언트 번들에 노출하지 않는다.
- Google Cloud Console에서 Maps JavaScript API와 Places API key 제한을 각각 설정한다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`를 통과시킨다.
