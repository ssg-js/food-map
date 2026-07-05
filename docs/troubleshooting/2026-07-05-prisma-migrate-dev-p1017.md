# Problem

MVP 3 DB 전환 중 `npm run db:migrate` 실행 시 다음 에러가 발생했다.

```text
Error: P1017

Server has closed the connection.
```

당시 `DATABASE_URL`은 `prisma+postgres://localhost:51213` 형식이었고, Prisma dev server는 내부 PostgreSQL TCP 포트 `localhost:51214`를 사용하고 있었다.

# Cause

`prisma migrate dev`는 개발 중 schema 변경을 감지하고 migration 생성/적용, shadow database 검증까지 수행한다. 이 과정에서 로컬 Prisma dev server 연결이 닫히며 `P1017`이 발생했다.

Next.js 개발 서버가 켜져 있었지만, `/api/restaurants` 조회 자체가 migration 실패의 직접 원인으로 확인되지는 않았다. 같은 migration 파일을 `prisma migrate deploy`로 적용했을 때는 정상 처리되었기 때문에, 이미 생성된 migration을 적용하는 상황에서는 `migrate dev`의 추가 개발용 검증 흐름이 불필요했다.

또한 Prisma dev server는 sandbox 환경에서 `not_running`으로 보이거나 시작이 완료되지 않았고, sandbox 밖 권한에서 `npx prisma dev start default`를 실행했을 때 정상적으로 `running` 상태가 되었다.

# Solution

1. Prisma dev server 상태를 확인했다.

```bash
npx prisma dev ls # dev ls: 로컬 Prisma dev server 상태 확인
```

2. 서버가 꺼져 있으면 sandbox 밖 권한에서 시작했다.

```bash
npx prisma dev start default # start default: default Prisma dev server 시작
```

3. 이미 존재하는 migration 파일은 `migrate deploy`로 적용했다.

```bash
npx prisma migrate deploy # migrate deploy: 생성된 migration SQL을 DB에 적용
```

4. seed 데이터를 적재했다.

```bash
npm run db:seed # db:seed: Restaurant seed 데이터를 DB에 upsert
```

# Verification

- `npx prisma migrate status`에서 `Database schema is up to date!` 확인
- `npm run db:seed`에서 `Seeded 105 restaurants.` 확인
- Prisma Client로 `Restaurant` row count `105` 확인
- `/api/restaurants` smoke test에서 `200 OK`와 105개 응답 확인
- `/map` 화면에서 DB 기반 맛집 마커 표시 확인

# Lessons Learned

- 이미 생성된 migration을 적용하는 목적이면 `prisma migrate deploy`가 `prisma migrate dev`보다 단순하고 안정적일 수 있다.
- `prisma migrate dev`는 새 migration 생성과 shadow database 검증까지 포함하므로, 로컬 Prisma dev server 상태에 더 민감할 수 있다.
- `prisma+postgres://localhost:51213` 연결에서는 Prisma dev server와 내부 PostgreSQL 포트가 모두 살아 있어야 한다.
- DB가 내려가면 `/api/restaurants`는 Prisma 조회 실패로 500을 반환하므로, 전체 기능 확인 전 `npx prisma dev ls`로 DB 상태를 먼저 확인한다.
