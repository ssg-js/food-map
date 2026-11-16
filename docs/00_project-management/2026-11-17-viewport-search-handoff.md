# 지도 범위 검색 · 인수인계

웹/PWA/Expo에 현재 지도 범위 검색, 이동 후 명시적 재검색, 검색 결과 마커, 목록 hover/focus/선택 강조, viewport 높이 레이아웃을 구현했다. DB 스키마·기존 계정·저장 자료·.env는 변경하지 않았다. 배포/main 병합/실제 Google API 호출은 수행하지 않았다.

## 화면

- 웹은 헤더·계정 행을 제외한 높이를 좌측 패널과 지도에 배분한다. 바깥 문서는 스크롤하지 않고 패널만 스크롤한다.
- 모바일 웹/앱은 지도 상단 고정, 하단 패널 내부 스크롤. 앱은 중첩 결과 ScrollView를 제거하고 safe area·키보드 회피를 유지했다.
- 첫 검색은 현재 bounds가 준비된 뒤 활성화. 지도 이동·확대·축소에 따라 마지막 검색 범위와 달라지면 ‘현 지도에서 검색’이 나타난다. 같은 범위로 돌아가면 숨김.
- 재검색은 마지막 제출 검색어를 사용한다. 지도 이동/hover/포커스만으로 API를 호출하지 않는다.
- 모든 검색 결과(최대10개)는 placeId로 목록·마커 연결. hover/focus 시 1.2배 강조, 터치 앱은 선택 강조. 결과 갱신 시 카메라를 자동 fit/reload하지 않는다.

## 필요한 API

새 API/키는 필요 없다. 기존 `GOOGLE_PLACES_API_KEY`의 Places API (New) Text Search에 `locationRestriction.rectangle`을 사용하고, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`의 Maps JavaScript API에서 bounds와 마커를 처리한다. Google이 제한을 적용하지 않는 상호명 검색도 있어 서버에서 응답 좌표로 한 번 더 필터링한다. 좌표가 없는 항목은 범위 검색 결과에서 제외한다.

`EXTERNAL_API_MODE=mock`은 키 없이 mock 검색/지도로 동작한다. 모의 지도는 실제 지도와 구분되며 성수·강남·서울시청 이동과 드래그/확대/축소를 제공한다. 실제 연결 시 기존 설정을 유지하되 브라우저 키의 허용 주소에 앱 API 서버의 /map-search를 포함한 경로가 허용돼야 한다(일반적으로 origin/*).

## 디자인·결과

- `디자인/수정중/웹/08_지도범위검색/{README.md,preview.html}`
- `디자인/수정중/앱/08_지도범위검색/{README.md,preview.html}`
- 실제 캡처: `docs/screenshots/viewport-search-desktop.png`, `viewport-search-mobile.png`, `viewport-search-expo-native-phone.png`, `viewport-search-expo-native-tablet.png`

기존 확정 메인 색상·컴포넌트를 재사용했으며 새 시안은 사용자 승인과 구분해 수정 중으로 유지한다.

## 검증

- 단위/MSW 27건: 잘못된 bounds 무예약·무호출, rectangle 전달, 범위 밖/무좌표 제거, 날짜변경선, 확대 시 범위 변경, 마커 강조 시 카메라/인스턴스 유지.
- 실제 서버·분리 DB 제품 38건: 기존 계정·소유권·저장·한도·가입 확인 회귀 + 웹/모바일 지도 범위/반환 범위/hover/포커스/재검색/진행 중 이동/360px 작은 화면 overflow.
- Expo 실제 컴포넌트 브라우저 렌더러 6건: 휴대폰/태블릿 현재 위치·등록·계정 복구·지도 범위 재검색·마커 강조·iframe navigation 0회·전체 화면 overflow.
- Next 프로덕션 빌드, 웹/앱 타입·린트, iOS·Android Hermes 번들 생성. 설치 파일(IPA/APK) 생성·실기기 실행은 이 환경에서 검증하지 않았다.

초기 공용 로컬 DB의 동시 조회 테스트가 정체돼 테스트 프로세스만 종료하고, 이름 viewport-qa-20261117/포트51221·51222의 별도 Prisma dev DB를 만들어 재검증했다. 정확한 내부 경합 원인은 확정하지 않았다. 분리 후 전체 제품/앱 테스트 통과, 원래 개발 DB 읽기 정상 확인. 테스트 스키마는 각 러너가 정리한다. 재현 시 별도 로컬 DB의 DATABASE_URL 환경 변수를 전달해 기존 개발 DB와 분리하는 것을 권장한다. 실제 .env는 수정하지 않았다.

일반 명령: `npm test`, `npm run test:product`, `npm run mobile:qa:export`, `npm run test:mobile-ui`. 제품/앱 러너는 고정 포트를 사용하므로 동시에 실행하지 않는다.

## Git

연속 브랜치: `feature/viewport-01-search-contract` → `feature/viewport-02-web-map` → `feature/viewport-03-expo-map`. 최종 결과는 마지막 브랜치가 앞선 내용을 모두 포함한다. 기능별 커밋으로 API 계약, 웹 지도/레이아웃, 앱 브리지/검증을 구분한다.
