# 외부 API mock·MSW 검증 기준

- 기본 EXTERNAL_API_MODE=mock. 키 존재만으로 실제 호출하지 않는다. 검색·상세·지도 모두 모의 표시다.
- Google 공식 요청/응답 DTO를 공통 fixture와 어댑터 계약 테스트로 검증한다.
- MSW3: http/HttpResponse는 `msw/http`, Node setupServer는 `msw/node`에서 가져온다.
- before listen(onUnhandledRequest:error), afterEach resetHandlers, after close. 성공/빈 결과/필드 누락/400/401/403/404/429/5xx/timeout/cancel을 검증한다.
- 인증·세션·소유권·한도는 실제 서버/분리 DB로 테스트하고 mock으로 우회하지 않는다.
- PWA 서비스워커와 충돌하지 않도록 브라우저 E2E에서는 실제 앱 서버의 외부 제공자 어댑터를 mock으로 실행한다. 화면 자체의 API 계약 단위 테스트는 MSW를 사용한다.
- React Native 단위 테스트도 Node setupServer를 재사용한다. 실제 RN 런타임 네트워크 대체가 필요하면 공식 @msw/react-native network를 쓰며 msw보다 먼저 import한다. 이번 앱의 기능 E2E는 실제 서버+모의 제공자를 기본으로 한다.
- 실연동은 명시적 live 설정과 별도 사용자 승인 이후에만 검증한다. 키가 없거나 실패하면 모의 데이터로 몰래 대체하지 않는다.

공식 근거: https://mswjs.io/api/setup-server/ · https://mswjs.io/guides/integrations/react-native
