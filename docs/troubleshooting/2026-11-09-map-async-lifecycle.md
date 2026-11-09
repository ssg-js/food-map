# Problem

개발 모드의 Strict Mode 재마운트나 지도 로딩 중 화면 이탈에서 이전 비동기 초기화가 뒤늦게 끝나 새 지도 인스턴스를 방해할 수 있었다.

# Cause

provider는 SDK 로드 뒤에도 destroy 여부를 검사하지 않았고, MapContainer의 비활성 초기화 콜백은 이미 정리된 provider를 다시 destroy했다. 같은 provider의 다음 마운트가 활성화된 경우 새 인스턴스까지 정리될 수 있었다.

# Solution

초기화 버전을 provider에 기록하고 destroy 시 증가시킨다. SDK 로드 후 오래된 버전은 인스턴스를 만들지 않는다. MapContainer의 오래된 완료 콜백은 추가 destroy 없이 종료한다.

# Verification

실제 Google API를 호출하지 않는 fake SDK로 초기화 도중 destroy, 다음 마운트, 인스턴스 수, 이벤트 listener 정리를 단위 테스트한다. 웹 lint/typecheck/build도 수행한다.

# Lessons Learned

비동기 SDK 초기화의 수명과 React effect의 수명은 별도로 검증해야 한다. 오래된 완료 콜백에서 공유 provider를 정리하면 새 마운트와 충돌할 수 있다.
