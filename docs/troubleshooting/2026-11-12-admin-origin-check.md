# Problem
실제 관리자 로그인 검증에서 같은 사이트의 요청이 403으로 거절됐다.

# Cause
Next.js가 Request URL을 내부 바인딩 호스트로 정규화하여 브라우저 Origin과 달라졌다.

# Solution
브라우저 Origin의 authority를 실제 Host 헤더와 비교하고 임의 forwarded-host는 신뢰하지 않는다. 잘못된 Origin과 누락 Origin은 거절한다. 네이티브 로그인은 고강도 접근 키를 검증하는 명시적인 별도 경로를 사용한다.

# Verification
실제 서버의 로그인·로그아웃과 권한 없는 API 차단 테스트.

# Lessons Learned
페이지 렌더링만으로 인증을 검증하지 말고 실제 브라우저와 서버를 함께 확인한다.
