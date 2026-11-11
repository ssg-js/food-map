# Problem

앱에서 검색하거나 저장한 장소를 선택해도 앱 안에서 위치를 볼 수 없었다.

# Why

외부 앱으로 매번 나가지 않고 검색과 저장 맥락 안에서 장소를 확인해야 한다.

# Decision

기존 Google Maps JavaScript provider를 앱 내부 WebView의 `/map-preview` 페이지에서도 재사용한다. 별도 iOS/Android Maps SDK 키가 없는 개발 환경에서도 동일한 지도 구현을 사용한다.

# Implementation

- 검색/저장 목록 선택 장소의 일시 좌표로 핀 표시, 선택 변경 시 지도 이동.
- 웹 화면은 GooglePointMap의 panTo/updateMarker를 사용한다.
- 앱은 Expo SDK58 호환 react-native-webview 14.0.1로 내부 지도 표시.
- 현재 위치 권한은 사용자가 버튼을 눌렀을 때만 요청한다.
- Google 지도 인증 오류·네트워크 오류 안내 및 외부 Google 지도 열기 제공.
- 지도 키는 공개 웹 키만 사용하고 서버 Places 키는 앱에 넣지 않는다.
- 실제 휴대폰은 EXPO_PUBLIC_API_URL을 이 컴퓨터의 LAN 주소로 설정한다. 같은 주소를 Google 키의 HTTP referrer 허용 목록에도 추가해야 한다.

# Result

localhost:3000에서 실제 Google Maps 캔버스와 핀 렌더링을 확인했다. 별도 검증 포트는 RefererNotAllowedMapError가 발생하는 것을 확인했고 안내를 추가했다. SDK 모킹 테스트에서는 좌표·마커 갱신을 확인한다.

# Retrospective

이 환경에는 전체 Xcode/Android SDK가 없어 네이티브 시뮬레이터 실기 실행은 수행하지 못한다. 앱 UI 브라우저 검증과 iOS/Android Hermes 번들 생성을 검증한다. 실제 기기 네트워크·키 주소 허용은 해당 기기에서 최종 확인이 필요하다.
