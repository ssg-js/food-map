# Context

MVP 지도 화면은 `IMapProvider` 추상화 위에서 동작한다. 초기에는 `StubMapProvider`로 UI 흐름을 검증했지만, 현재는 Google Maps JavaScript API key가 설정되어 `/map`에서 실제 Google Maps 렌더링이 필요하다. 초기 프로젝트 단계에서는 비용이 발생하지 않도록 사용 범위를 최대한 제한해야 한다.

Google Maps Platform은 과금 계정과 API 키가 필요하다. 2025년 이후에는 기존 월 $200 크레딧 방식이 아니라 SKU별 월 무료 사용량 기준으로 운영된다. Maps JavaScript API의 Dynamic Maps는 Essentials SKU이며, 지도 초기화에 따른 successful map load가 과금 이벤트가 된다.

# Options

## Option 1: Google Maps JavaScript API를 바로 전체 연동

- 장점: 실제 서비스와 가까운 지도 경험을 빠르게 확인할 수 있다.
- 단점: API 키, 과금 계정, quota, referrer 제한 등 운영 설정이 필요하다.
- 단점: 개발 중 페이지 새로고침이나 반복 접근만으로도 map load가 증가한다.

## Option 2: 기존 Stub 지도 유지 후 설계만 확정

- 장점: 비용 위험이 없다.
- 장점: 현재 `IMapProvider` 추상화를 유지하면서 Google 어댑터의 계약만 미리 정리할 수 있다.
- 단점: 실제 Google Maps SDK 로딩, 이벤트, 마커 동작은 아직 검증하지 못한다.

## Option 3: Static Maps 또는 Embed API 우선 사용

- 장점: JavaScript SDK보다 기능이 제한되어 과금 위험을 낮출 수 있다.
- 단점: 현재 필요한 마커 클릭, 바텀시트, 지도 상태 동기화 구조와 맞지 않는다.
- 단점: 향후 interactive map으로 다시 전환해야 한다.

# Decision

초기 설계에서는 Option 2를 선택했고, API key 설정 이후 제한 조건을 유지한 채 Option 1의 최소 범위만 구현한다.

Google Maps SDK를 npm package로 추가하지 않고, `/map` 페이지 진입 시 클라이언트에서 Maps JavaScript API script만 lazy load한다.

1. `widgets/map`의 `IMapProvider` 인터페이스는 유지한다.
2. `GoogleMapProvider`가 `IMapProvider`를 구현한다.
3. `MapProviderType`은 `"stub" | "google"`을 허용한다.
4. Server Component는 `providerType="google"`처럼 직렬화 가능한 문자열만 전달한다.
5. Google Maps provider 생성, script loading, SDK 인스턴스 관리는 `"use client"` 경계 안에서만 수행한다.
6. Places, Geocoding, Directions, Routes API는 MVP에서 사용하지 않는다.
7. 맛집 데이터는 이미 위도/경도를 가진 mock/API 데이터를 사용한다.

# Limited Usage Policy

무료 사용을 최대한 유지하기 위해 실제 연동 시 다음 제한을 적용한다.

- Google Cloud에서 **Maps JavaScript API만 enable**한다.
- Places API, Geocoding API, Directions API, Routes API는 enable하지 않는다.
- API key는 HTTP referrer 제한을 건다.
- 개발용 referrer는 `localhost`와 현재 배포 도메인만 허용한다.
- Google Cloud Billing budget alert를 설정한다.
- 가능하면 Maps JavaScript API quota를 낮게 설정한다.
- 지도 SDK는 `/map` 페이지에서만 lazy load한다.
- 홈(`/`)이나 다른 페이지에서는 Google Maps script를 로드하지 않는다.
- mock 좌표를 그대로 사용하고 주소 → 좌표 변환을 하지 않는다.
- 검색 자동완성, 길찾기, 거리 계산, 장소 상세 조회는 MVP 범위에서 제외한다.
- 지도 로드는 페이지 진입당 1회만 발생하도록 provider 인스턴스를 재사용한다.

# Implementation Shape

파일 구조:

```text
src/widgets/map/
├── lib/
│   ├── create-map-provider.ts
│   └── load-google-maps.ts
└── model/
    ├── google-map-provider.ts
    ├── map-provider.ts
    └── stub-map-provider.ts
```

예상 사용 방식:

```tsx
// Server Component
<MapProvider providerType="google">
  <MapView />
</MapProvider>
```

```ts
// Client-side factory
export type MapProviderType = "stub" | "google";
```

API key는 다음 환경 변수로 관리한다.

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

이 값은 브라우저에서 사용되는 public key이므로 비밀값으로 간주하지 않는다. 대신 Google Cloud Console에서 referrer 제한과 API 제한을 반드시 적용한다.

# Consequences

- 현재 MVP는 `/map` 페이지에서 Google Maps를 렌더링한다.
- `/map` 외 페이지에서는 Google Maps script를 로드하지 않는다.
- 지도 SDK 교체 가능성은 기존 `IMapProvider` 구조로 유지된다.
- Google Maps 연동 기능 범위는 지도 표시와 마커 표시로 제한된다.
- Places, Geocoding, Directions를 붙이는 순간 별도 과금 SKU가 생기므로 별도 ADR이 필요하다.

# Verification Plan

실제 구현을 시작할 때 다음을 검증한다.

1. `/map` 이외 페이지에서 Google Maps script가 로드되지 않는지 확인한다.
2. `providerType="google"` 전달 시 Server → Client function prop 에러가 없는지 확인한다.
3. `npm run lint` 통과.
4. `npx tsc --noEmit` 통과.
5. `npm run build` 통과.
6. Google Cloud Console에서 API key 제한과 budget alert 설정을 확인한다.
