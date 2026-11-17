# Problem
로컬 설정이 클라우드에 복사될 때 localhost 인증/DB와 운영 키 제한을 놓칠 수 있었다.
# Cause
개발 편의를 위한 fallback과 별개로 운영 설정을 검증하는 시작 경계가 없었다. env 파일도 로컬에서 다른 사용자가 읽을 수 있는 0644였다.
# Solution
운영 표식과 사전검사 명령을 도입하고 서버 register 시 안전하지 않은 설정을 거부한다. 기존 env 값은 변경하지 않고 파일 권한만0600으로 제한했다. 검사 진단은 비밀값 없이 ID/설명만 포함한다. Node 24에서 공식 env 로더 CommonJS interop 및 TS 순수 검사 모듈의 로딩도 검증했다.
# Verification
현재 로컬 환경의 production 검사는 RUNTIME_GUARD/AUTH_ORIGIN/TRUSTED_ORIGINS/DATABASE_TARGET을 차단한다. 올바른 합성 운영값은 통과하고 비밀값·TLS·origin 오류/서버 register는 단위 테스트로 검증했다. 실제 클라우드 연결은 수행하지 않았다.
# Lessons Learned
운영 체크 실패를 없애기 위해 개발 env를 임의 덮어쓰지 않는다. 코드 검사와 실제 운영 인프라 확인을 구분하고, 빌드 도구 취약점의 dependency 집계도 숨기지 않는다.
