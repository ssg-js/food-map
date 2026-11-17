# 맛집지도

개인 계정으로 맛집을 직접 저장하고 목적·음식 종류·대표 메뉴로 다시 찾는 Next.js 웹/PWA와 Expo 앱입니다. 공통 API 계약을 사용하고, 서버가 계정별 소유권과 Google 요청 한도를 검사합니다.

## 실행

Node.js 24와 npm을 사용합니다. 의존성은 각 `package-lock.json`으로 관리합니다.

```bash
nvm use # .nvmrc의 Node 24
npm ci
npm run db:generate
npm run dev
```

루트 `env.example`을 참고하여 로컬 `.env`를 설정합니다. 실제 값은 Git에 올리지 마세요. 기본 외부 API 모드는 mock입니다. `http://localhost:3000`에서 개인 초기 계정 설정 또는 로그인을 진행합니다. 초기 계정 설정은 서버의 `PERSONAL_SETUP_TOKEN`이 필요하며 누구나 가입하는 공개 회원가입은 제공하지 않습니다.

```bash
npm run mobile:install
cp apps/mobile/env.example apps/mobile/.env
# EXPO_PUBLIC_API_URL을 개발 컴퓨터의 LAN origin으로 변경
npm run mobile:start
```

웹과 앱 모두 Next API 서버가 켜져 있어야 합니다. 앱 지도는 인증된 Maps JavaScript 프레임을 WebView/iframe으로 표시합니다. 별도 Apple Maps/Android Maps SDK 키는 사용하지 않습니다. 앱 릴리스 API 주소는 HTTPS여야 하고 서버 Places 키를 앱에 복사하면 안 됩니다. 자세한 주소·빌드 설정은 [배포 가이드](docs/deployment/README.md)를 확인하세요.

## 주요 화면

- `/map`: 현재 지도 범위에서 외부 장소 검색, 검색 핀·현재 위치, 카테고리 선택 후 직접 저장.
- `/saved`: 내 맛집의 목적·음식 종류·대표 메뉴 필터, 지도·수정·삭제.
- `/categories`: 내 카테고리 생성·이름/그룹 수정·삭제. 마지막 분류를 없애는 삭제는 차단.
- `/account/security`, `/recover`: 비밀번호 변경·복구 키 발급/회전·아이디/비밀번호 복구.
- `/admin/api-usage`: OPERATOR 계정 전용 사용량 화면. 관리자 역할도 타인의 보관함을 열 수 없습니다.
- `/terms`, `/privacy`: 로그인 전에도 볼 수 있는 이용·데이터 안내 초안. 실제 운영자 고지는 배포 전에 확정해야 합니다.

모든 개인 데이터 변경은 로그인 세션으로 보호하며 과거 `ADMIN_ACCESS_KEY`로 보관함 권한을 우회하지 않습니다. Google Place ID와 사용자 분류를 저장하고 이름·주소 등 외부 장소 표시 정보는 영속 캐시하지 않습니다. 위치는 전경 단발 요청이며 백그라운드 추적은 없습니다.

## PWA와 오프라인

`npm run build` 후 `npm start`로 로컬 프로덕션 모드를 확인합니다. 설치와 위치 권한은 HTTPS 또는 localhost에서 동작합니다. LAN HTTP에서는 제한될 수 있습니다. 오프라인에서는 연결 안내만 표시하며 개인 API·장소 데이터·저장 대기열을 영구 캐시하지 않습니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run mobile:lint
npm run mobile:typecheck
npm run mobile:export # iOS/Android 번들 생성; IPA/APK나 실기기 검증 아님
```

실제 인증·소유권·동시 한도 테스트는 **로컬의 분리 DB 스키마**로 수행합니다. 외부 Google만 mock으로 바꿉니다. 운영 DB로 테스트하지 마세요.

```bash
npm run test:integration
npm run test:product
npm run mobile:qa:export
npm run test:mobile-ui
```

## 배포 전 확인

```bash
npm run check:deployment # 로컬 읽기 전용 설정 검사
npm run check:deployment:production # 클라우드 설정 검증; 아직 배포하지 않음
```

현재 감사와 수정 내역은 [배포 준비 감사 보고서](docs/audits/2026-11-17-deployment-readiness.md), 실행·마이그레이션·키·복원 절차는 [배포 운영 가이드](docs/deployment/README.md)에 있습니다. 실제 배포/클라우드 계정 연결은 이번 개발에 포함하지 않았습니다.

## 구조와 기준

- `src/`: Next 웹·API, FSD 구조.
- `apps/mobile/`: Expo 앱과 별도 lockfile.
- `packages/registration/`: 공유 API·계정·등록·지도 계약.
- `docs/product/`: 개인 서비스의 현재 명세와 후속 요구.
- `docs/audits/`: 보안·설계·구현·배포 점검 근거와 잔여 항목.
- `디자인/수정중/{웹,앱}/`: 구현/검토 시안. 사용자 확정본만 `디자인/확정/`에 둡니다.

공통 코드 변경 후 앱 시작/export 시 동기화합니다. 고정 지도 프레임은 메시지로 상태를 주고받으며 토큰·좌표를 URL에 넣지 않습니다. 과거 MVP·공용 관리 문서는 이력이며 현재 기준은 개인 서비스 명세와 최신 감사/인수인계입니다.
