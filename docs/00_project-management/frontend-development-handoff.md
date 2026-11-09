# 프론트엔드 개발 인수인계

개발 완료일: 2026-11-09 (한국 시간)

브랜치: `feature/responsive-pwa-expo`

## 구현한 내용

- 승인한 v2 메인 시안에 맞춘 파란색 기반 반응형 등록 화면.
- 데스크톱 좌측 등록 패널·우측 지도, 모바일 웹의 지도·등록 시트 배치.
- PWA manifest·아이콘·홈 화면 설치 안내·연결 끊김 안내·오프라인 페이지.
- `apps/mobile`의 Expo Router 기반 iOS·Android 앱과 공통 등록 컨트롤러.
- 장소 검색 제출, 후보 선택, 복수 카테고리 지정·생성, 저장·완료·오류·재시도.
- 선택 변경 시 카테고리 초기화, 생성/저장 중 중복 요청 방지, 카테고리 0개 저장.
- 공통 패키지 응답 검증, 입력 정규화, 요청 타임아웃. Google 데이터는 기기에 영구 저장하지 않는다.
- 비동기 지도 초기화 도중 destroy/재마운트 충돌 보완.

기존 API·Prisma schema·migration은 내용 해시 비교로 변경하지 않았음을 확인했다. DB migration·seed·실제 데이터 등록을 실행하지 않았다. 사용자 인증·즐겨찾기·리뷰·사진·거리·맛집 마커는 추가하지 않았다.

## 검증 결과

- 웹 ESLint: 통과
- 웹 TypeScript: 통과
- Next.js 프로덕션 빌드: 통과
- 공통 API 및 지도 수명주기 단위 테스트: 8개 통과
- 데스크톱/모바일 웹 브라우저 테스트: 12개 통과
- 앱 ESLint / TypeScript: 통과
- Expo 공식 진단: 20/20 통과
- iOS·Android Metro/Hermes 번들 export: 모두 통과 (각 약 2.8MB)
- React Native Web 렌더러의 휴대폰·태블릿 UI 테스트: 2개 통과
- PWA 서비스 워커가 API·Google 콘텐츠를 캐시하지 않는지 검사: 통과

웹·앱 테스트는 기존 API 계약에 맞는 고정 응답을 사용했다. 과금되는 Google 검색과 실제 DB 변경 없이 UI 동작을 확인했다. 실제 Google·DB 연결 상태를 검증한 결과는 아니다.

스크린샷은 `docs/screenshots/`에 보관한다. 지도 키를 비운 QA 환경이므로 예시 배경으로 표시된다. 앱 스크린샷은 실제 React Native 컴포넌트의 웹 렌더러 결과이며 시뮬레이터 캡처가 아니다.

## 바로 실행하기

지원 Node 버전: 24 (`.nvmrc`). 시스템 Node 23은 Expo SDK 58 지원 범위 밖이다.

웹:

```bash
npm run dev
```

`http://localhost:3000`에서 `/map`으로 이동한다. 기존 루트 `.env`를 유지한다.

앱:

```bash
cp apps/mobile/env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL을 기기에서 접속 가능한 이 컴퓨터의 LAN 주소로 변경
npm run mobile:start
```

앱은 위 Next.js 서버를 함께 실행해야 한다. iOS 시뮬레이터 기본 주소는 `127.0.0.1:3000`, Android 에뮬레이터 기본 주소는 `10.0.2.2:3000`이다. 실기기는 반드시 LAN 주소 또는 접근 가능한 HTTPS 주소를 사용한다. `.env` 변경 뒤 Expo 개발 서버를 재시작한다.

앱 공통 로직은 시작/export 전에 자동 동기화한다. `packages/registration` 수정 후 앱 개발 서버를 재시작한다. 앱 의존성을 다시 설치할 때에는 `npm run mobile:install`을 사용한다.

PWA 확인:

```bash
npm run build
npm start
```

서비스 워커와 설치는 production 모드, HTTPS 또는 localhost에서 확인한다. `qa:build`는 Google 호출 없는 테스트 전용 빌드이므로 실제 지도를 확인하려면 일반 `build`로 다시 빌드한다.

## 한 번에 재검증

```bash
npm run verify:web
npm run verify:mobile
```

웹 검증은 3100, 네이티브 화면 검증용 서버는 3200 포트를 사용하고 종료 시 정리한다. 처음 브라우저 테스트를 실행하는 환경에서는 `npx playwright install chromium`이 필요하다.

## 검증 범위와 남은 운영 설정

- 이 Mac에는 전체 Xcode와 Android 빌드 환경이 없어 iOS·Android 실기기/시뮬레이터 실행 및 서명된 IPA/APK 빌드는 수행하지 않았다. Metro 번들 생성과 웹 렌더러 테스트를 네이티브 실행 결과로 간주하지 않는다.
- iOS 기본 지도는 Apple Maps다. Android 실제 지도에는 별도 Maps SDK용 키가 필요하다. 키가 없으면 예시 배경을 표시하고 등록 흐름은 유지한다.
- 서버 전용 Google Places 키를 모바일 환경 변수에 복사하면 안 된다. 기존 서버 설정을 사용한다.
- 루트 기존 DB와 Google 계정 설정이 유효해야 실시간 장소 검색/등록이 동작한다.
- 네이티브 앱 식별자는 개발용 `com.foodmap.development`다. 배포·서명·스토어 제출은 이 작업의 범위 밖이다.
- 배포·푸시·main 병합을 수행하지 않는다. 기존 디자인은 수정중 상태를 유지한다.

## 변경 구조

- `src/app`, `src/features`, `src/widgets`: 웹 화면·PWA·지도 UI
- `apps/mobile`: 별도 앱과 독립 의존성
- `packages/registration`: 웹·앱 공통 API와 상태 처리
- `public/icons`, `public/sw.js`, `public/offline.html`: PWA 자산
- `tests`, `scripts`: 반복 가능한 검증과 공통 소스 동기화
- `docs/features`, `docs/adr`, `docs/troubleshooting`: 구현·결정·문제 해결 기록

제안 커밋 메시지: `feat(frontend): add responsive PWA and Expo registration clients`
