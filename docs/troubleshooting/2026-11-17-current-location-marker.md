# Problem
검색 후 현재 위치 점이 사라지고, 다른 지역으로 이동한 후 같은 좌표로 현재 위치를 요청해도 카메라가 복귀하지 않았다.
# Cause
현재 위치를 검색 결과가 없을 때만 표시하는 fallback으로 취급했다. 지도 카메라는 위도·경도가 변할 때만 갱신되어 동일 위치 재요청을 구분하지 못했다.
# Solution
GPS 상태와 검색 결과 상태를 분리하고 항상 독립 마커를 전달한다. 지도 중심 이동 버전으로 같은 좌표 재요청도 구분한다. Google hover/클릭은 위치 점과 장식 원을 음식점으로 취급하지 않는다.
# Verification
웹·앱 린트/타입 검사, Next 프로덕션 빌드, 단위/MSW 테스트 28건, 웹 데스크톱·모바일 제품 테스트 40건, Expo 휴대폰·태블릿 브라우저 UI 테스트 6건 통과. Expo QA 웹 번들 생성 성공. 외부 API는 mock, QA DB는 사용자 DB와 분리했다. Google 제공자는 fake Maps API로 마커 스타일/카메라 불변성을 검증했다. 실제 Google 호출 및 iOS/Android 실기기 검증은 수행하지 않았다.
초기 회귀 테스트에서 동일 좌표 복귀가 실패해 centerRevision을 추가했고 재검증 후 모두 통과했다. 화면 결과: docs/screenshots/current-location-desktop.png, docs/screenshots/current-location-mobile.png.
# Lessons Learned
카메라 중심, 검색 마커, 실제 사용자 위치는 서로 다른 의미이므로 좌표가 같더라도 별개로 관리한다.
