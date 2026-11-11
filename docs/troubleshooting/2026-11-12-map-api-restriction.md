# Problem

실제 지도 연결에서 Maps Embed 요청이 403으로 거절됐다.

# Cause

현재 공개 지도 키의 API 허용 목록에 Maps Embed가 포함되지 않았다.

# Solution

기존 Maps JavaScript provider를 재사용해 웹과 앱 내부 지도 페이지에 일시 좌표로 핀을 표시한다. 서버 키를 노출하거나 Google Cloud 권한을 자동 변경하지 않는다. 페이지당 지도 인스턴스를 재사용하며 핀 선택은 panTo/updateMarker만 실행한다.

# Verification

실제 Google 연결과 SDK 모킹 브라우저 테스트로 지도 준비·좌표·마커 갱신을 확인한다.

# Lessons Learned

설정 파일의 키 존재만으로 API 활성화를 판단하지 않는다. Maps JavaScript의 지도 로드 과금은 Places 내부 집계와 별개다.
