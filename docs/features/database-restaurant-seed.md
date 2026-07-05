# Problem

MVP 1과 MVP 2는 mock 데이터를 기반으로 지도 탐색, 검색, 필터를 검증했다. 다음 단계에서는 mock 데이터 의존을 줄이고 PostgreSQL + Prisma 기반 데이터 조회로 전환해야 한다.

# Why

맛집 지도 서비스는 검색, 필터, 상세 페이지, 등록 기능으로 확장될수록 DB 기반 데이터 모델이 필요하다. UI와 React Query 흐름은 유지하면서 API 조회 계층만 DB로 전환해 화면 변경 위험을 줄인다.

# Decision

- `Restaurant` 모델을 Prisma schema에 추가한다.
- 현재 mock 맛집 데이터는 `prisma/seed-data/restaurants.ts`로 옮겨 seed 데이터로 관리한다.
- seed는 `upsert` 방식으로 구현해 여러 번 실행해도 같은 id 기준으로 갱신되게 한다.
- `/api/restaurants`는 Prisma Client로 `Restaurant` 테이블을 조회한다.
- React Query hook과 UI 컴포넌트는 기존 응답 계약을 유지한다.

# Implementation

- `prisma/schema.prisma`에 `Restaurant` 모델과 카테고리/좌표 인덱스를 추가했다.
- `prisma/seed-data/restaurants.ts`에 기존 mock 데이터와 생성 seed 데이터를 추가했다.
- `prisma/seed.ts`에서 `PrismaClient`로 seed 데이터를 upsert한다.
- `prisma/migrations`에 Restaurant 테이블 생성 SQL을 추가했다.
- `package.json`에 Prisma generate/migrate/seed 명령을 추가했다.
- `src/shared/lib/prisma.ts`에 개발 환경 hot reload 중 DB connection 증가를 줄이기 위한 Prisma Client singleton을 추가했다.
- `src/app/api/restaurants/route.ts`에서 mock 데이터 대신 Prisma Client로 맛집 목록을 조회한다.

# Result

- PostgreSQL에 `Restaurant` 테이블을 생성할 수 있다.
- seed 명령으로 기존 mock 맛집 데이터를 DB에 적재할 수 있다.
- `/api/restaurants`는 DB에 적재된 맛집 데이터를 반환한다.
- UI와 React Query hook은 기존 `Restaurant[]` 응답 형태를 그대로 사용한다.

# Retrospective

- 다음 단계에서 검색/필터를 서버 query parameter 기반으로 확장할 수 있다.
- 실제 운영 전에는 seed 데이터와 production 데이터를 분리해야 한다.
