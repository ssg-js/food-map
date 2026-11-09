# Problem

독립 Expo 앱이 외부 폴더의 공통 등록 패키지를 symlink로 참조하자 Expo 진단에서 웹과 앱의 서로 다른 React 설치가 함께 발견됐다. 이를 피하려고 모든 계층적 모듈 탐색을 끄면 Expo 내부의 중첩 `expo-asset` 의존성을 찾지 못했다.

# Cause

공통 패키지의 peer dependency가 실제 소스 위치 기준으로 상위 Next.js의 React를 탐색했다. React Native와 Next.js가 요구하는 버전을 억지로 통일하거나 진단을 끄는 방법은 기존 프로젝트에 불필요한 영향을 줄 수 있었다.

# Solution

- 앱 `.npmrc`에서 `install-links=true`를 사용한다. 공통 패키지는 앱 node_modules 내부에 복사 설치되고 React는 앱의 의존성으로 해석된다.
- `scripts/sync-mobile-core.mjs`가 앱 시작과 export 전에 공통 소스의 최신 내용을 복사한다. symlink 설치 상태에서는 소스를 잘못 덮지 않도록 실패시킨다.
- Metro는 Expo 기본 구성을 사용한다. 중첩 Expo 의존성 탐색도 유지한다.
- 공통 로직 수정 후 앱 개발 서버를 재시작한다. 웹은 기존 Next.js 소스 갱신 방식을 사용한다.

# Verification

`npm run mobile:doctor`, 앱 lint/typecheck, iOS·Android export, React Native Web 렌더러의 UI 테스트로 확인한다. 실제 실행 결과는 인수인계 문서에 기록한다.

# Lessons Learned

독립 앱의 로컬 패키지 링크는 런타임뿐 아니라 네이티브 autolinking 진단에도 영향을 준다. React singleton 문제는 경고를 숨기기보다 실제 패키지 해석 경로를 격리해 해결한다. 지원되는 Node 버전도 SDK 기준으로 맞춰야 한다.
