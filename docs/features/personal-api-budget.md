# Problem
모의 개발과 실제 API의 사용량을 구분하면서 동시 호출에도 총 한도를 지켜야 한다.
# Why
화면에서만 횟수를 세면 다중 서버·재시작·동시 요청을 막을 수 없다.
# Decision
외부 호출 전 PostgreSQL 짧은 트랜잭션과 advisory lock으로 예약한다. 실패·타임아웃은 환불하지 않는 보수적 집계다.
# Implementation
- `EXTERNAL_API_MODE=live`를 명시하지 않으면 mock. 기존 키가 있어도 외부 호출하지 않는다.
- ApiUsage: mode(mock/live), api(SEARCH/DETAILS/ALL), scope(global/user:id), period(태평양 일/월), count. 장소명/검색어/비밀번호는 기록하지 않는다.
- 검색+상세가 공통 ALL 한도를 사용. 기본 일100, 월1000, 전역 및 사용자 단위 모두 적용. 초과는 429, code와 resetAt 전달. DB/설정 오류는 실패 시 차단.
- live는 기존 GoogleSearchBudget도 반드시 통과. `GOOGLE_SEARCH_LIMITS_DISABLED`는 신규 경로에서 무시. 신규 월은 운영자가 확인 후 기존 예산을 설정해야 함.
- live에서 추가 한도를 상향하더라도 일100/월4500을 넘으면 설정 오류 차단. 실제 Google SKU별 무료량을 뜻하지 않음.
- 관리자 대시보드는 현재 모드의 실제 예약 건수와 검색/상세 내역 표시. Monitoring은 live+명시적 인증 설정일 때만 호출.
# Result
잔여2에 동시12건(검색/상세 혼합)을 보내 정확히2건 성공,10건429, 저장 카운터80 유지 검증. 기존 DB 예산 경쟁·월 경계·서버 재시작도 검증.
# Retrospective
내부 카운터는 Google의 과금 잔여량 조회가 아니다. 브라우저 Maps JS 로드는 별도 경로로 이 카운터로 완전 통제되지 않는다. 실제 연결 전 Cloud의 해당 SKU 쿼터/키 제한을 함께 설정해야 한다. 현재 개발 검증에서는 실제 키와 유료 서비스를 연결하지 않았다.
