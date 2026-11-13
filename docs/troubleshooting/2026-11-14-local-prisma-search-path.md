# Problem
로컬 Prisma dev DB에서 migrate deploy가 migration persistence is not initialized 오류를 냈다.
# Cause
분리 테스트 스키마를 사용한 뒤 개발 DB의 SQL search_path가 남아 있었다. public의 이력 테이블은 존재하지만 비정규화된 원시 쿼리는 테스트 경로를 참조했다.
# Solution
백업은 public 테이블을 명시한다. `scripts/migrate-local.mjs`는 로컬 호스트만 허용하고 public을 명시한 직접 연결에서 search_path를 초기화한 후 표준 migrate deploy를 실행한다. 사용자 데이터 삭제/DB 리셋은 수행하지 않았다.
# Verification
기존 public 자료 1맛집/6카테고리/0연결을 별도 0600 JSON 백업한 후 신규 마이그레이션 정상 적용. 분리 스키마의 마이그레이션 통합 테스트에서 연결 보존도 검증.
# Lessons Learned
로컬 개발 DB와 테스트 DB는 물리적으로 분리하는 편이 가장 안전하다. 테스트의 정리 대상은 생성한 테스트 스키마 이름을 검증하고 제한한다. 앱 ORM은 모델의 스키마를 명시하며 백업 원시 SQL도 반드시 정규화한다.
