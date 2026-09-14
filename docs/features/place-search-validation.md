# Problem

실제 장소 데이터를 붙이기 전, Google Places API를 클라이언트가 직접 호출하지 않고 Next.js Route Handler 뒤에서 안전하게 호출할 수 있는지 검증해야 한다.

# Why

Places API key는 서버에서만 사용해야 하며, Google 응답을 그대로 프론트엔드에 노출하면 외부 API 구조에 앱이 강하게 결합된다. MVP 6 Phase 1에서는 Restaurant 저장이나 rate limit 없이 Text Search (New) 호출, 최소 FieldMask, 앱 전용 DTO 변환만 먼저 확인한다.

# Decision

- `GET /api/places/search?q=` endpoint를 추가한다.
- Google Places Text Search (New)는 서버에서만 호출한다.
- 서버 전용 환경 변수 `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACES_ENABLED`를 사용한다.
- `GOOGLE_PLACES_ENABLED !== "true"`이면 외부 API를 호출하지 않는다.
- 최소 검색어 길이는 2자로 둔다.
- FieldMask는 `places.id,places.displayName.text,places.formattedAddress`를 사용한다.
- 클라이언트에는 `placeId`, `name`, `address`만 포함한 DTO 배열을 반환한다.
- Restaurant 저장, Place Details, Autocomplete, rate limiter는 구현하지 않는다.

# Implementation

- `src/app/api/places/search/route.ts`에서 `q` query parameter를 검증한다.
- Google Places enabled 여부와 API key 설정 여부를 서버에서 확인한다.
- Text Search (New)에 `POST https://places.googleapis.com/v1/places:searchText` 요청을 보낸다.
- `X-Goog-Api-Key`와 `X-Goog-FieldMask`는 서버 요청 header에만 포함한다.
- Google 응답의 `places` 배열을 앱 전용 `PlaceSearchResultDto[]`로 변환한다.
- 필수 DTO 필드가 없는 Google place는 결과에서 제외한다.

# Result

- Places API 호출은 서버 Route Handler 뒤에 숨겨진다.
- Google 원본 응답 구조는 클라이언트로 전달되지 않는다.
- API key는 응답 DTO에 포함되지 않는다.
- 환경 변수가 없거나 disabled 상태이면 외부 API 호출 없이 실패 응답을 반환한다.
- `성심당` 검색은 16개 장소 후보를 반환했고, 첫 번째 DTO는 `placeId`, `name`, `address`만 포함했다.
- `스타벅스 강남역` 검색은 11개 장소 후보를 반환했고, 첫 번째 DTO는 `placeId`, `name`, `address`만 포함했다.
- 결과가 없을 가능성이 높은 검색어는 빈 배열을 반환했다.
- 빈 검색어는 Google API를 호출하지 않고 400 응답을 반환했다.

# Retrospective

- Google Cloud API key는 Maps JavaScript API용 브라우저 key와 Places API (New)용 서버 key를 분리해야 한다.
- 서버용 Places key는 HTTP referrer 제한을 쓰면 서버 호출에서 차단된다.
- 서버용 Places key의 API restrictions에는 Places API와 Places API (New)가 모두 필요할 수 있다.
- 다음 단계에서는 Places Details, 저장 가능한 필드, `Restaurant.googlePlaceId` 저장 전략을 별도 범위로 다룬다.
- 호출량 제한은 PostgreSQL 기반 일별 사용량 guard를 우선 검토한다.
