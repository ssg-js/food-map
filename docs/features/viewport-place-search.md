# Problem
검색과 지도 bounds가 연결되지 않아 보고 있는 영역 밖의 결과가 섞이고 검색 결과 마커·목록 연동이 없었다. 등록 패널 높이와 바깥 스크롤도 화면을 넘겼다.
# Why
사용자는 현재 보고 있는 지역을 탐색하고 목록에서 지도 위치를 빠르게 확인해야 한다.
# Options
위치 근처를 선호하는 locationBias와 범위 제한 locationRestriction을 비교하고 후자를 선택했다. 외부 API는 기존 Places API (New) Text Search와 Maps JavaScript API를 유지한다.
# Decision
현재 viewport 사각형을 필수 검색 계약으로 전달. 서버가 범위 좌표를 검증한 뒤 API 호출 전에 예약하고 locationRestriction.rectangle로 전달한다. Google이 범위 제한을 적용하지 않는 이름 검색도 있어 응답 좌표로 다시 필터링하며 좌표가 없는 결과는 지도 범위 검색 결과에서 제외한다. 검색/이동/hover는 별개 동작.
# Implementation
일치하지 않는 범위·날짜변경선·경계값을 공통 모듈로 처리. 검색 시점 bounds를 스냅샷으로 보관해 검색 도중 이동했더라도 새 범위 버튼이 정확히 표시된다. hover는 카메라를 변경하지 않고 마커 크기·zIndex만 바꾼다. 앱 지도는 고정 WebView/iframe과 메시지로 결과·뷰포트를 교환하여 결과 갱신 시 reload하지 않는다.
모의 제공자도 같은 bounds 계약으로 필터링하며 모의 지도에 이동·확대·축소 조작 제공. 테스트는 mock이고 실제 Google 호출은 수행하지 않는다. DB/스키마 변경 없음.
# Result
단위·MSW 27건, 실제 서버·분리 DB의 데스크톱/모바일 제품 38건, Expo 휴대폰/태블릿 UI 6건 통과. 타입·린트 및 Next 빌드와 iOS/Android 번들 생성 검증. 실제 Google 호출 없이 mock으로 검증했다.
# Retrospective
Google Text Search의 한 요청 최대10개만 표시하며 전체 장소 전수 검색은 아니다. 실기기 네이티브 검증은 별도 환경이 필요하다.

공식 근거: https://developers.google.com/maps/documentation/places/web-service/text-search#locationrestriction · https://developers.google.com/maps/documentation/javascript/reference/marker
필요한 기존 키: GOOGLE_PLACES_API_KEY(Places API New), NEXT_PUBLIC_GOOGLE_MAPS_API_KEY(Maps JavaScript). 별도 키·새 유료 서비스 없음.

## 조작 의미와 성능
- ‘현 지도에서 검색’은 마지막 제출 검색어와 최신 viewport를 사용한다. 입력을 바꾼 경우 일반 검색 버튼으로 제출한다.
- 같은 범위로 돌아오면 재검색 버튼이 숨겨진다. 검색 중 지도를 옮겨도 응답에 사용한 범위를 스냅샷으로 유지해 새 범위 버튼이 남는다.
- idle과 bounds_changed를 수신하며 이동 중 bounds 업데이트는 requestAnimationFrame으로 묶는다. 좌표 키를 소수점 5자리로 정규화해 미세 오차에 의한 상태 반복을 줄인다.
- 마커는 최대10개, 기존 인스턴스를 갱신한다. hover는 scale 9→10.8과 zIndex만 변경하고 카메라 이동/장소 조회/검색을 하지 않는다.
- 지도 검색 화면에서는 결과 위치로 fit하지 않는다. 터치 지도는 greedy 제스처로 지도 영역 안에서 한 손가락 이동을 지원하고 목록은 별도 스크롤한다.
- 모바일 웹은 검색 성공 시 패널 내부를 결과 위치로 이동한다. 앱은 상단 지도를 고정하고 하단 패널 하나만 스크롤하며 중첩 목록 스크롤을 제거했다.
- 초기 위치 실패 안내는 검색 후 결과/버튼을 가리지 않게 정리한다. 기본 위치는 실제 사용자 위치와 구분한다.

실제 결과: `docs/screenshots/viewport-search-{desktop,mobile,expo-native-phone,expo-native-tablet}.png`.
