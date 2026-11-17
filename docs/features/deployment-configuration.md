# Problem
개발용 주소·비밀값·DB를 클라우드에 그대로 복사해도 오류를 사전에 알려주는 배포 경계가 없었다. 오래된 프레임워크와 사용하지 않는 지도 의존성도 남아 있었다.
# Why
개인 서비스라도 인터넷에 연결되면 인증·요청·키·DB 경계가 필요하다. 설정 검사와 실제 인프라 확인을 구분해야 한다.
# Decision
설치된 Next의 공식 headers/environment/instrumentation 계약을 사용한다. 현재 스택을 유지하며 같은 major 보안 업데이트와 순수 오프라인 검사를 적용하고, 실제 배포/과금 계정 연결은 하지 않는다.
# Implementation
Next/eslint 설정 16.4.6, 기본 보안 헤더, DEPLOYMENT_ENV production의 서버 시작 가드, check:deployment 및 production build/start 명령을 추가했다. 앱 릴리스는 HTTPS origin·QA 해제 검사를 거치며 QA는 별도 export로 분리한다. 미사용 react-native-maps 의존성과 설정을 제거하고 Prisma CLI는 빌드 도구로 분류했다. optional peer로 인해 CLI 취약 패키지가 production audit에도 남는 한계를 보고서에 기록했다.
# Result
순수 설정/시작 가드 테스트와 실제 응답 헤더·PWA 캐시 제품 테스트 통과. 전체 최종 검증은 단위50/웹58/앱10/DB통합1, 웹/앱 lint·타입·빌드/번들 통과. 상세는 docs/audits/2026-11-17-validation.json을 기준으로 한다.
# Retrospective
설정 검사 통과는 Cloud Console 제한·백업 복원·실기기·운영 고지의 확인을 대신하지 않는다. 잔여 Prisma/Expo 도구 취약점은 강제 downgrade나 검증 없는 major override로 숨기지 않는다.
