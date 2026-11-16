# Problem
앱 QA에서 새 지도 프레임은 초기 HTML만 보이고 현재 위치·검색 결과 메시지를 반영하지 못했다.
# Cause
기존 정적 Expo QA 서버는 /map-preview HTML만 프록시했고 Next /_next 정적 스크립트는 Expo index.html로 대체했다. 기존 정적 mock 지도는 서버 HTML로 보였지만 메시지 수신을 위한 새 프레임 hydration은 실행될 수 없었다.
# Solution
QA 서버는 /map-search와 /_next/ 요청도 Next 테스트 서버로 전달한다. 웹 프레임은 Origin+source를 검사하고 map-ready 이후 최신 state를 다시 전송한다. 네이티브 WebView는 고정 URI와 injectJavaScript로 최신 state를 전달하고 발신 URL을 검사한다.
# Verification
휴대폰/태블릿에서 현재 위치, 검색 마커, hover·포커스, 지도 이동 후 재검색, 프레임 navigation 0회, 문서 가로·세로 overflow 없음 확인. 실제 서버 기반 앱 UI 6건 통과.
# Lessons Learned
서버 HTML 표시만으로 동작 완료를 판단하지 않는다. 프레임의 스크립트 로드와 양방향 메시지 전달까지 검증한다.
