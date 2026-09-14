# Problem

Google Places 검색 결과를 우리 서비스의 맛집으로 등록할 수 있는 경로가 없었다. 또한 기존 `Restaurant`는 이름, 주소, 좌표, 평점 같은 장소 정보를 직접 보관하는 모델이어서, 외부 장소 데이터를 복제하는 구조가 될 위험이 있었다.

# Why

Google Places는 장소 검색과 식별을 담당하는 외부 Provider로만 쓰고, 우리 DB는 우리가 만든 데이터만 소유해야 한다. `placeId`는 Google 정책상 caching restriction 예외라서 영구 저장할 수 있지만, 이름·주소·좌표·평점·리뷰·사진 등은 영구 저장 대상이 아니다.

동시에 서비스의 차별점은 "우리가 정의한 카테고리"이므로, 한 맛집에 여러 카테고리를 붙일 수 있는 관계 모델이 필요하다.

# Decision

- `Restaurant`는 `googlePlaceId`만 외부 식별자로 저장하고 Google 장소 상세 정보는 저장하지 않는다.
- 우리 카테고리는 `Category`로 관리하고, `RestaurantCategory` join 모델로 다대다 관계를 만든다.
- `RestaurantCategory`는 복합 PK `(restaurantId, categoryId)`로 관계 중복을 막는다.
- `POST /api/restaurants`에 전달된 `categoryIds`를 해당 맛집의 최종 카테고리 집합으로 취급한다.
- 저장은 하나의 transaction에서 처리한다.
- 장소 검색 결과의 `name`, `address`는 화면 표시용으로만 쓰고 DB에 저장하지 않는다.
- 위도·경도는 이번 단계에서 저장하지 않는다.

# Implementation

## 데이터 모델

```prisma
model Restaurant {
  id            String   @id @default(cuid())
  googlePlaceId String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  categories RestaurantCategory[]
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())

  restaurants RestaurantCategory[]
}

model RestaurantCategory {
  restaurantId String
  categoryId   String

  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  category   Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([restaurantId, categoryId])
  @@index([categoryId])
}
```

## API

- `GET /api/categories`: 전체 카테고리를 `name` 오름차순으로 `{ items: Category[] }` 형태로 반환한다.
- `POST /api/categories`: 이름을 trim하고 연속 공백을 하나로 정규화한 뒤 생성한다. 빈 이름과 20자 초과는 400, 중복 이름은 unique 제약 위반(P2002)을 409로 변환한다.
- `POST /api/restaurants`: `googlePlaceId`로 upsert해 중복 생성을 막고, 전달된 `categoryIds`가 모두 존재하는지 확인한 뒤 관계를 최종 집합으로 동기화한다.
- `GET /api/restaurants`: 저장된 맛집과 연결된 카테고리를 반환한다.

## 저장 transaction

```txt
categoryIds 존재 확인
↓
Restaurant upsert (googlePlaceId 기준)
↓
전달되지 않은 기존 관계 삭제
↓
전달된 관계 createMany(skipDuplicates)
↓
Restaurant + categories 조회 후 반환
```

존재하지 않는 `categoryId`가 하나라도 있으면 transaction 내부에서 예외를 던져 전체를 롤백하고 400을 반환한다.

## 프론트엔드

- `features/place-registration`에 검색·카테고리·저장 흐름을 모아두었다.
- `usePlaceSearch`는 검색 버튼으로 확정된 검색어만 사용하고, 최소 길이 미만이면 `enabled: false`로 Google 호출을 막는다.
- 같은 검색어는 React Query 캐시로 처리되어 리렌더만으로 재호출되지 않는다.
- `useCategories`는 자주 바뀌지 않는 서버 상태이므로 `staleTime`을 5분으로 둔다.
- 저장과 카테고리 생성은 mutation으로 처리하고, 생성 성공 시 카테고리 목록 쿼리를 무효화한다.

# Result

- 검색한 Google 장소를 `googlePlaceId` 기준으로 맛집 등록할 수 있다.
- 같은 장소를 반복 저장해도 `Restaurant`는 하나만 유지된다.
- 전달한 `categoryIds`가 그대로 최종 관계 집합이 된다.
- Google 장소의 이름·주소·좌표·평점은 DB에 남지 않는다.

기존 지도 브라우징 기능은 좌표를 보관하지 않게 되면서 데이터 소스를 잃었다. 마커 렌더링, bounds 기반 조회, 카테고리 칩 필터와 관련 코드는 이번 단계에서 제거했다.

# Places 캐싱 정책

```txt
placeId
→ 영구 저장 가능

latitude / longitude
→ 향후 필요 시 최대 30 consecutive calendar days 캐시
→ cachedAt / expiresAt 필요
→ 만료 후 삭제 또는 Google에서 재조회

그 외 Google Places Content
→ 현재 Restaurant 영구 데이터로 저장하지 않음
```

향후 위치 기능이 필요해지면 아래 형태의 별도 캐시 모델을 검토한다. 이번 migration에서는 만들지 않았다.

```txt
GooglePlaceCache

googlePlaceId
latitude
longitude
cachedAt
expiresAt
```

# Retrospective

- 저장된 맛집을 지도에 표시하려면 좌표가 필요하므로, `GooglePlaceCache`와 Place Details 호출 정책을 다음 단계에서 함께 설계해야 한다.
- 현재 카테고리는 전역 공용이라 사용자별 소유권이 없다. 인증 도입 시 생성자/공용 구분이 필요하다.
- Google 호출량 제한은 아직 없다. PostgreSQL 기반 일별 사용량 guard를 우선 검토한다.
- 카테고리 이름 정규화는 trim과 연속 공백 축약 수준이다. 유사어·대소문자·별칭 정리는 미뤘다.
