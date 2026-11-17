# Problem
개인 한도에 막힌 요청이 공유 카운터를 소모했고 로그인 시도 기록과 API 본문이 외부 입력에 의해 증가할 수 있었다. 일부 개인 응답 캐시 정책도 누락됐다.
# Cause
사용량 예약이 서로 다른 transaction이었고, 사용자 아이디를 검증 전에 rate scope로 저장했다. JSON 전체를 읽은 뒤 스키마 길이를 검사했으며 GET 중심으로만 캐시를 금지했다.
# Solution
예산 예약을 원자적으로 처리하고 모든 로그인 전역 cap과 실제 계정 scope를 사용한다. 시간 prefix 기반 제한된 배치 정리, 64KiB/10초 streaming body reader, 공통 privateJson 응답을 도입했다.
# Verification
단위 테스트는 chunked/위조길이/UTF8/빈·손상 JSON/정지 스트림·private 응답을 검사한다. 제품 테스트는 로그인 scope 증가 방지/전역429/과대413/CRUD no-store를 검사한다. 실제 분리 PostgreSQL 통합 테스트는 예산 rollback·동시성·음수 차단을 검사한다. 최종 실행 결과는 종합 감사 보고서에 기록한다.
# Lessons Learned
스키마 문자열 제한은 JSON 파싱 전에 소모되는 메모리를 제한하지 않는다. 제한에 걸린 요청은 외부에 보내지 않았으므로 서로 다른 예산 카운터를 부분 커밋하면 안 된다. 클라우드에서도 프록시와 애플리케이션 각각의 경계를 명시해야 한다.
