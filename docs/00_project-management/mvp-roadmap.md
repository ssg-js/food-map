# Food Map MVP Roadmap

이 문서는 개발 완료 순서대로 MVP 범위와 다음 확장 지점을 정리한다.

---

# MVP 1 - Map Exploration

# Goal

사용자가 지도 페이지에 진입해 현재 위치 기반으로 주변 맛집을 탐색하는 기본 흐름을 검증한다.

# Scope

- `/map` 페이지 진입
- 현재 위치 권한 요청
- 현재 위치 기준 지도 렌더링
- 현재 위치로 지도 중심을 다시 이동하는 버튼
- React Query로 `/api/restaurants`에서 임시 맛집 mock 데이터 조회
- 맛집 마커 표시
- 마커 클릭 시 바텀시트에 맛집 요약 정보 표시
- 지도 SDK 교체를 고려한 provider 추상화 유지

# Out of Scope

- 로그인
- 회원가입
- 맛집 등록, 수정, 삭제
- DB 기반 맛집 조회
- 맛집 상세 페이지 이동
- 검색, 필터, 정렬
- 즐겨찾기
- 리뷰
- 길찾기
- Google Places, Geocoding, Directions, Routes API 연동

# Done Criteria

- 사용자가 홈에서 `/map` 페이지로 이동할 수 있다.
- `/map` 페이지에서 지도가 렌더링된다.
- 지도 SDK 로딩 중/실패 상태가 사용자에게 표시된다.
- 브라우저 위치 권한 요청이 발생한다.
- 위치 권한 허용 시 현재 위치 기준으로 지도 중심이 이동한다.
- 현재 위치 버튼 클릭 시 지도 중심이 현재 위치로 이동한다.
- 위치 권한 거부 또는 실패 시 기본 위치로 지도가 표시된다.
- React Query로 조회한 mock 맛집 데이터가 지도 위 마커로 표시된다.
- 맛집 마커 클릭 시 바텀시트가 열린다.
- 바텀시트에 맛집 이름, 카테고리, 평점, 주소, 설명이 표시된다.
- 바텀시트는 선택된 맛집 id를 기준으로 React Query 데이터에서 derived state로 표시된다.
- 상세 페이지 이동 없이 바텀시트까지만 동작한다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/map-exploration`

# Status

Done

---

# MVP 2 - Map Search and Filter

# Goal

사용자가 지도 위 맛집을 이름, 주소, 카테고리 기준으로 빠르게 좁혀 볼 수 있게 한다.

# Scope

- 지도 상단 검색 입력창
- 이름, 주소, 카테고리 기준 클라이언트 검색
- 카테고리 필터 버튼
- 검색어와 카테고리에 따른 지도 마커 갱신
- 결과 없음 안내 UI
- 필터 초기화 버튼

# Out of Scope

- DB 기반 검색
- 서버 API 검색
- Google Places API
- 로그인
- 즐겨찾기
- 리뷰
- 상세 페이지
- 지도 이동 시 데이터 요청

# Done Criteria

- 검색어 입력 시 이름, 주소, 카테고리에 매칭되는 맛집만 지도 마커로 표시된다.
- 카테고리 버튼 클릭 시 해당 카테고리 맛집만 지도 마커로 표시된다.
- 검색어와 카테고리 필터가 함께 적용된다.
- 결과가 없으면 안내 UI가 표시된다.
- 필터 초기화 버튼 클릭 시 검색어와 카테고리가 초기화된다.
- 필터 결과에서 선택된 맛집이 제외되면 바텀시트가 닫힌다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/map-search-filter`

# Status

Done

---

# MVP 3 - Database Restaurant Seed

# Goal

mock 맛집 데이터 의존을 줄이고 PostgreSQL + Prisma 기반 맛집 데이터 조회로 전환한다.

# Scope

- Prisma `Restaurant` 모델 정의
- Restaurant 테이블 migration 추가
- 기존 mock 맛집 데이터를 seed 데이터로 이전
- Prisma seed 스크립트 추가
- DB 관련 npm scripts 추가
- `/api/restaurants` Prisma Client 기반 DB 조회 전환

# Out of Scope

- React Query hook 수정
- 지도 UI 수정
- 서버 검색
- 상세 페이지
- 로그인
- 리뷰
- 즐겨찾기

# Done Criteria

- `Restaurant` 모델이 Prisma schema에 정의된다.
- migration SQL로 Restaurant 테이블과 인덱스를 생성할 수 있다.
- seed 스크립트로 기존 mock 맛집 데이터를 DB에 upsert할 수 있다.
- `/api/restaurants`가 DB에 적재된 맛집 데이터를 반환한다.
- `npm run db:generate`가 통과한다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/db-restaurant-seed`

# Status

Done

---

# MVP 4 - Server Restaurant Filter

# Goal

맛집 검색/필터를 클라이언트 derived state에서 서버 query parameter 기반 DB 조회로 전환한다.

# Scope

- `/api/restaurants?search=&category=` query parameter 추가
- Prisma `where` 기반 이름, 주소, 카테고리 검색
- 카테고리 정확 일치 필터
- React Query query key에 필터 상태 포함
- 지도 마커를 서버 필터 결과로 렌더링
- 서버 검색/필터 기능 문서 추가

# Out of Scope

- 검색 debounce
- pagination
- 지도 bounds 기반 조회
- 카테고리 목록 전용 endpoint
- Google Places API
- 상세 페이지
- 로그인
- 리뷰
- 즐겨찾기

# Done Criteria

- 검색어가 `/api/restaurants` query parameter로 전달된다.
- 카테고리가 `/api/restaurants` query parameter로 전달된다.
- 검색어와 카테고리가 함께 적용된다.
- React Query가 필터별 query key로 서버 결과를 캐시한다.
- 결과 없음 안내 UI가 서버 필터 결과 기준으로 표시된다.
- `/api/restaurants`는 기존 `Restaurant[]` 응답 계약을 유지한다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/server-restaurant-filter`

# Status

Done

---

# MVP 5 - Bounds Restaurant Query

# Goal

지도 viewport 기준으로 현재 보고 있는 영역 안의 맛집만 조회하고, 카테고리별 현재 bounds 내 결과 수를 표시한다.

# Scope

- `/api/restaurants?north=&south=&east=&west=&search=&category=` bounds query parameter 추가
- Prisma 위도/경도 조건 기반 viewport 내부 맛집 조회
- React Query query key에 bounds 포함
- 지도 idle 또는 이동 완료 이벤트 후 bounds 갱신
- `/api/restaurant-categories` 카테고리 옵션 endpoint 추가
- 전체 기준 카테고리 목록과 현재 bounds 기준 `boundsCount` 제공
- `boundsCount === 0`인 카테고리는 선택 가능하게 유지하되 흐리게 표시

# Out of Scope

- Google Places API 호출
- 실제 장소 후보 검색
- marker clustering
- pagination
- 날짜변경선 crossing 처리
- 상세 페이지
- 로그인
- 리뷰
- 즐겨찾기

# Done Criteria

- 지도 bounds가 `/api/restaurants` query parameter로 전달된다.
- API가 bounds 내부 맛집만 반환한다.
- 검색어, 카테고리, bounds가 함께 적용된다.
- 카테고리 목록은 전체 기준으로 유지된다.
- 각 카테고리에 현재 bounds 내부 결과 수가 표시된다.
- `boundsCount === 0` 카테고리는 disabled가 아니라 흐리게 표시된다.
- 선택된 카테고리는 bounds 내부 결과가 없어도 유지된다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/bounds-restaurant-query`

# Status

Planned

---

# MVP 6 - Place Search Integration

# Goal

Google Places API를 서버 Route Handler 뒤에 두고, 사용자가 실제 장소 후보를 검색해 우리 서비스의 맛집 데이터로 저장할 수 있는 기반을 만든다.

# Scope

- Places API 호출용 서버 Route Handler 설계
- `/api/place-search` 장소 후보 검색 endpoint 추가
- `/api/places/:placeId` 장소 상세 조회 endpoint 추가
- Google Places 응답을 앱 전용 DTO로 정규화
- 사용자가 선택한 장소를 `Restaurant`로 저장하는 흐름 설계
- API key, 비용, rate limit, 캐싱 정책 문서화

# Out of Scope

- Google Places 데이터 대량 수집
- 자동 동기화 batch
- 사용자 인증 기반 소유권 관리
- 리뷰
- 즐겨찾기
- 사진 저장 정책 확정

# Done Criteria

- 클라이언트는 Places API를 직접 호출하지 않는다.
- 서버가 Google Places 후보 검색을 호출하고 정규화된 응답을 반환한다.
- 저장 가능한 데이터와 저장하지 않을 데이터를 문서화한다.
- Google Maps Platform API key 제한과 비용 관리 정책을 문서화한다.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`가 통과한다.

# Branch

`feature/place-search-integration`

# Status

Planned
