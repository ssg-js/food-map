# Problem

Next.js App Router에서 `/map` 페이지 접근 시 다음 에러가 발생했다.

```
Functions cannot be passed directly to Client Components
```

`app/map/page.tsx`(Server Component)가 `MapProvider`(Client Component)에 `createProvider={createStubMapProvider}` 함수 prop을 전달한 것이 원인이다.

# Cause

Next.js App Router에서 Server Component → Client Component로 props를 전달할 때는 JSON으로 직렬화 가능한 값(string, number, boolean, null, 배열, 객체)만 허용된다. 함수는 직렬화할 수 없으므로 RSC 경계에서 에러가 발생한다.

```tsx
// Server Component (page.tsx)
<MapProvider createProvider={createStubMapProvider}>  // ❌ 함수 prop
  <MapView />
</MapProvider>
```

`MapProvider`는 `"use client"` 컴포넌트이지만, 부모 `page.tsx`는 기본적으로 Server Component이다. Server Component가 Client Component에 함수를 넘기면 React Server Components 직렬화 규칙에 위배된다.

# Solution

1. `createProvider` 함수 prop을 제거했다.
2. 지도 provider 생성 로직을 Client Component 내부(`MapProvider`)로 이동했다.
3. `widgets/map/lib/create-map-provider.ts`에 팩토리 함수를 두고, `useState(() => createMapProvider(...))`로 클라이언트에서만 인스턴스를 생성한다.
4. Server Component에서 SDK를 선택해야 할 경우를 위해 직렬화 가능한 `providerType?: 'stub'` 문자열 prop만 허용한다.

```tsx
// Server Component (page.tsx) — 함수 prop 없음
<MapProvider>
  <MapView />
</MapProvider>

// Client Component (map-provider.tsx)
const [provider] = useState(() => createMapProvider(providerType));
```

향후 Kakao/Naver 연동 시 `providerType="kakao"` 같은 문자열 enum으로 Server → Client 전달이 가능하다.

# Verification

- `app/map/page.tsx`에서 `createStubMapProvider` import 제거 확인
- `/map` 페이지 접근 시 RSC 직렬화 에러 미발생
- `npm run lint` 및 `npx tsc --noEmit` 통과

# Lessons Learned

- Server Component는 Client Component에 **함수·클래스 인스턴스·Date 등 비직렬화 값**을 props로 넘길 수 없다.
- SDK 팩토리·이벤트 핸들러·콜백은 `"use client"` 경계 **안쪽**에 배치한다.
- Server에서 Client로 설정을 넘길 때는 문자열 enum, ID, plain object 등 직렬화 가능한 값을 사용한다.
- Client Component를 Server Component에서 **children으로 감싸는 패턴**은 가능하다. 문제는 함수 props 전달이다.
