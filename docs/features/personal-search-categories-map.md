# Problem
새 맛집 검색과 저장한 맛집 검색의 의미를 분리하고 세 분류로 개인 자료를 찾아야 한다.
# Why
사용자는 상호·음식·메뉴로 새 장소를 발견하고 목적·음식·메뉴로 내 보관함을 좁힌다.
# Decision
기존 메인 화면과 공통 registration 패키지를 확장한다. 검색어 조합은 버튼 제출 시에만 Google 계약으로 전달하고 저장 분류에 자동 반영하지 않는다.
# Implementation
- 웹/Expo에서 상호·지역 자유 입력 + 음식 종류 + 대표 메뉴를 공백으로 조합하고 최종 검색어 표시. Google 공식 `includedType=restaurant`, `strictTypeFiltering=true`로 음식점 유형을 제한하고 사용자 음식명은 텍스트에 반영한다.
- PURPOSE/FOOD/DISH의 사용자 지정 값. 저장은 정상 분류 중 최소 하나 필요. 기존 UNCLASSIFIED는 보존하되 그것만으로 새 저장/수정은 불가.
- 내 목록 카테고리 부분 이름 검색과 그룹별 OR/그룹 간 AND 필터, 12개 페이지.
- 수정/삭제 소유권 확인 및 수정 버전 충돌 409. 마지막 정상 카테고리 삭제는 409로 막고 먼저 재분류 안내.
- 최대 현재 페이지 12개 장소를 조회하여 지도 핀 표시. 카드와 지도는 placeId로 연결. 좌표/이름/주소는 메모리에만 유지하며 DB에는 placeId만 영구 저장.
- 모의 지도는 명시적 배지. 실제 Google 지도는 명시적 live 모드에서만 로드. 앱은 웹 지도 프레임을 재사용하고 선택 메시지는 알려진 프레임 Origin/source만 처리한다.
- 실패한 장소는 목록을 유지하고 재조회 제공. 현재 위치는 권한과 오차 안내를 제공하고 저장하지 않는다.
# Result
실제 서버·DB의 데스크톱/모바일, Expo 휴대폰·태블릿 화면으로 검증한다. Google 네트워크 호출이 없는지 브라우저에서도 확인한다.
# Retrospective
전체 저장 장소를 일괄 조회하지 않는다. 상세 조회는 TanStack Query 키를 공유해 카드/지도가 중복 호출하지 않으며 화면 이탈 시 제거한다. 실제 네이티브 지도 SDK로 변경하는 것은 별도 작업이다.

Google 요청 형식 근거: https://developers.google.com/maps/documentation/places/web-service/text-search
