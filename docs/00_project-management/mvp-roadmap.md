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
