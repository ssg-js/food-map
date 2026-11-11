# 개발 한도 해제와 현재 위치

로컬 .env의 GOOGLE_SEARCH_LIMITS_DISABLED=true로 요청 차단만 해제한다. DB 집계는 계속하며 DB 연결과 월 카운터 설정이 필요하다. 운영에서는 이 값을 제거하거나 false로 복구한다.

웹 지도 현재 위치 표시 버튼은 브라우저 위치 권한을 요청한다. 성공하면 좌표를 메모리에만 유지하고 Google Maps Embed에서 표시한다. 거부·시간 초과 안내 및 재시도를 제공한다. 좌표를 DB에 저장하지 않는다. HTTPS 또는 localhost가 필요하다. Maps Embed API 활성화가 필요하다.
