# 맛집지도

MVP 7의 장소 검색 → 카테고리 선택·생성 → 맛집 등록을 제공하는 Next.js 웹/PWA와 Expo 모바일 앱입니다. 기존 Next.js API·PostgreSQL·Prisma를 두 프론트엔드가 함께 사용합니다.

## 로컬 웹

Node 24를 사용하세요 (`.nvmrc`). 기존 서버 환경 변수는 루트 `.env`에 유지합니다.

```bash
npm ci
npm run db:generate
npm run dev
```

`http://localhost:3000`에서 등록 화면으로 이동합니다. 실기기에서 접속할 때에는 같은 네트워크의 컴퓨터 LAN 주소를 사용하세요.

## 모바일 앱

```bash
npm run mobile:install
cp apps/mobile/env.example apps/mobile/.env
# apps/mobile/.env의 EXPO_PUBLIC_API_URL을 컴퓨터의 LAN 주소로 수정
npm run mobile:start
```

먼저 위의 Next.js 서버를 실행해야 검색·등록이 동작합니다. iOS 시뮬레이터는 `http://127.0.0.1:3000`, Android 에뮬레이터는 `http://10.0.2.2:3000`을 사용할 수 있습니다. 실기기에서는 `localhost`를 사용하지 마세요. Expo SDK 58을 지원하는 Expo Go 또는 개발 빌드가 필요합니다. 플랫폼 지도 모듈의 네이티브 구성이 바뀌면 개발 빌드를 다시 만들어야 합니다.

iOS 지도는 Apple Maps를 사용합니다. Android 실제 지도는 별도로 제한된 Maps SDK용 키를 `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`에 설정해야 합니다. 키가 없어도 검색·카테고리·등록 화면은 사용할 수 있고 지도는 예시 배경임을 표시합니다. 서버 전용 Places 키를 앱에 복사하지 마세요.

## PWA

`npm run build` 후 `npm start`로 프로덕션 모드에서 확인합니다. 홈 화면 설치와 서비스 워커는 HTTPS 또는 localhost에서 동작합니다. LAN의 일반 HTTP 주소에서는 설치/위치 권한 기능이 제한될 수 있습니다. iOS Safari는 공유 → 홈 화면에 추가, Android Chrome/PC Edge는 설치 메뉴를 사용합니다.

오프라인에서는 연결 안내를 표시합니다. 검색과 저장은 온라인 기능이며 오프라인 저장 큐나 API 데이터 영구 캐시는 없습니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run mobile:lint
npm run mobile:typecheck
npm run mobile:export
```

브라우저 테스트는 실제 DB나 Google API를 변경·호출하지 않는 고정 응답을 사용합니다.

```bash
npx playwright install chromium
npm run qa:build
npm run test:e2e
# qa:build는 지도 키를 비운 검증용 빌드입니다. 실제 지도 확인 전 npm run build를 다시 실행하세요.
```

## 구조

- `src/`: 기존 Next.js 웹·서버, FSD 구조 유지
- `apps/mobile/`: 별도 Expo 앱·의존성·lockfile
- `packages/registration/`: 공통 API 계약과 등록 컨트롤러
- `디자인/`: 검토용 시안
- `디자인/보관/초기-v1/`: 이전 폴더에서 가져온 참고 자료

상세 결정과 검증 결과는 `docs/adr/2026-11-08-web-pwa-native-registration.md`, `docs/00_project-management/frontend-development-handoff.md`에서 확인합니다. 이 작업은 로컬 개발이며 배포하지 않습니다.

공통 로직 수정 후에는 앱 개발 서버를 재시작하세요. 앱 시작/export 시 공통 패키지를 자동 동기화합니다. 네이티브 화면의 브라우저 검증은 `npm run mobile:qa:export` 후 `npm run test:mobile-ui`로 실행할 수 있습니다. 이 렌더러 검증은 iOS·Android 실기기 실행을 대체하지 않습니다.
