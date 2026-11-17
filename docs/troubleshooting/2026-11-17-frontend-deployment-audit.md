# Problem
릴리스 앱이 로컬/HTTP API로 조용히 연결하고, 익명 지도 문서가 열리며, 저장 지도 선택 시 좌표 query와 재로드가 발생했다. 저장소 차단 시 웹 로그아웃 후 이동이 중단되고 계정 요청은 무기한 대기할 수 있었다.
# Cause
개발 fallback을 배포에도 적용했고 지도 문서를 개인 API와 별도 공개 자원으로 취급했다. 현재 위치/선택 상태를 URI로 직렬화했으며 부가 탭 알림과 주 작업의 오류 경계를 분리하지 않았다. 계정 요청은 공통 등록 API의 timeout/오류 처리와 달랐다.
# Solution
명시적인 API origin 검증, 서버 requirePageUser, native source Bearer header와 고정 메시지 MapFrame, 카메라/GPS 분리, 예외를 흡수하는 알림, 요청 제한/DTO 검증과 세션 응답 버전 검증을 적용했다. 11월 18일 최종 PM 교차 검토에서 필수 계정 query key 누락을 확인해 서버 검증 user.id/앱 AuthGate ownerId를 중앙 personalQueryKeys에 전달하고 개인 쿼리·캐시 수정·무효화 범위를 계정별로 분리했다. 운영 전 안내 초안과 귀속 표시도 구현했다.
# Verification
웹/앱 lint·typecheck 통과. 프론트 신규 단위 8건 포함 통합 단위 50건 통과. 제품/앱 실제 서버 검증은 상위 감사에 요청했으며 최종 결과를 전체 보고서에 남긴다. 실제 Google 호출·배포·물리 기기 실행은 하지 않았다.
# Lessons Learned
보호된 API와 공개 문서는 비용 공격면이 다르다. 위치·토큰은 UI 상태 전달을 위해 URL에 넣을 필요가 없다. 알림/기기 저장소 실패가 서버에서 이미 성공한 로그아웃의 화면 정리를 막아서는 안 된다.
