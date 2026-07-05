# MVP 3 DB Setup Guide

이 문서는 프로젝트를 다른 위치로 옮긴 뒤에도 MVP 3의 DB 계층 구축 작업을 다시 따라가기 위한 참고 가이드다.

# Goal

MVP 3의 첫 목표는 기존 mock 맛집 데이터 의존을 줄이고, PostgreSQL + Prisma 기반으로 맛집 데이터를 조회할 수 있는 DB 계층과 API 조회 흐름을 구축하는 것이다.

이번 단계에서는 **DB 계층과 `/api/restaurants` 조회 로직**을 만든다.

아직 수정하지 않는 범위:

- React Query hook
- 지도 UI
- 검색/필터 UI
- 상세 페이지

# Branch

추천 브랜치:

```bash
git switch -c feature/db-restaurant-seed # -c: 새 브랜치 생성 후 이동
```

# Files To Create

생성할 파일:

```text
prisma/seed.ts
prisma/seed-data/restaurants.ts
prisma/migrations/migration_lock.toml
prisma/migrations/20260624153000_add_restaurant_model/migration.sql
docs/features/database-restaurant-seed.md
src/shared/lib/prisma.ts
```

수정할 파일:

```text
prisma/schema.prisma
prisma.config.ts
package.json
package-lock.json
docs/00_project-management/mvp-roadmap.md
src/app/api/restaurants/route.ts
```

# Prisma Schema

`prisma/schema.prisma`에 `Restaurant` 모델을 추가한다.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Restaurant {
  id          String   @id
  name        String
  address     String
  category    String
  latitude    Float
  longitude   Float
  rating      Float
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([latitude, longitude])
}
```

인덱스 의도:

- `category`: 카테고리 필터와 향후 서버 검색 대비
- `[latitude, longitude]`: 지도 bounds 기반 조회 확장 대비

# Seed Data

기존 `src/shared/constants/mock-restaurants.ts`의 데이터를 seed 전용 파일로 옮긴다.

추천 위치:

```text
prisma/seed-data/restaurants.ts
```

내보낼 값:

```ts
export const SEED_RESTAURANTS = [
  // 기존 mock 데이터
];
```

seed 데이터 타입 예시:

```ts
interface SeedRestaurant {
  id: string;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  description: string;
}
```

# Seed Script

`prisma/seed.ts`를 생성한다.

```ts
import { PrismaClient } from "@prisma/client";

import { SEED_RESTAURANTS } from "./seed-data/restaurants";

const prisma = new PrismaClient();

async function main() {
  for (const restaurant of SEED_RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: restaurant,
      create: restaurant,
    });
  }

  console.log(`Seeded ${SEED_RESTAURANTS.length} restaurants.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

`upsert`를 쓰는 이유:

- seed를 여러 번 실행해도 중복 생성되지 않는다.
- 같은 `id`가 있으면 update한다.
- 없으면 create한다.

# Prisma Config

`prisma.config.ts`의 `migrations` 설정에 seed 명령을 추가한다.

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

# Package Scripts

`tsx`를 dev dependency로 추가한다.

```bash
npm install --save-dev tsx # --save-dev: 개발용 의존성으로 설치
```

`package.json` scripts에 추가한다.

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed"
  }
}
```

# Migration SQL

`prisma/migrations/20260624153000_add_restaurant_model/migration.sql`:

```sql
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Restaurant_category_idx" ON "Restaurant"("category");
CREATE INDEX "Restaurant_latitude_longitude_idx" ON "Restaurant"("latitude", "longitude");
```

`prisma/migrations/migration_lock.toml`:

```toml
provider = "postgresql"
```

# API DB Query

`src/shared/lib/prisma.ts`를 생성해 Prisma Client를 공유한다.

개발 환경에서는 Next dev server hot reload 중 `PrismaClient` 인스턴스가 반복 생성될 수 있으므로 `globalThis`에 client를 보관한다.

`src/app/api/restaurants/route.ts`는 mock 데이터 대신 `prisma.restaurant.findMany()`를 호출한다.

조회 결과는 기존 클라이언트가 검증하는 `Restaurant[]` 응답 계약을 유지하도록 `id`, `name`, `address`, `category`, `latitude`, `longitude`, `rating`, `description`만 선택한다.

# Execution Commands

Prisma schema 검증:

```bash
npx prisma validate # validate: Prisma schema/config 검증
```

Prisma Client 생성:

```bash
npm run db:generate # db:generate: Prisma Client 생성
```

Migration 적용:

```bash
npm run db:migrate # db:migrate: migration을 DATABASE_URL DB에 적용
```

Seed 실행:

```bash
npm run db:seed # db:seed: seed 데이터를 DATABASE_URL DB에 적재
```

전체 순서:

```bash
npm run db:generate # Prisma Client 생성
npm run db:migrate # Restaurant 테이블 migration 적용
npm run db:seed # Restaurant seed 데이터 적재
```

# Validation

DB 계층 구축 후 앱 검증:

```bash
npm run lint # lint: ESLint 검사
npx tsc --noEmit # --noEmit: 타입 체크만 수행하고 파일 생성 안 함
npm run build # build: Next.js production build
```

# Important Notes

- `db:seed`는 실제 `DATABASE_URL`에 연결된 PostgreSQL에 데이터를 쓴다.
- seed 실행 전 `.env`의 `DATABASE_URL`이 올바른지 확인한다.
- `/api/restaurants`는 Prisma Client로 DB를 조회한다.
- UI와 React Query는 기존 `Restaurant[]` API 응답 계약을 유지한다.
- 다음 단계에서 검색/필터를 서버 query parameter 기반으로 확장할 수 있다.
