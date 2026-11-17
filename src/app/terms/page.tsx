import { ServicePolicy } from "@/features/legal/components/ServicePolicy";
export const metadata = { title: "서비스 이용 안내 · 맛집지도" };
export default function TermsPage() {
  return (
    <ServicePolicy title="서비스 이용 안내">
      <section>
        <h2>나만의 맛집 보관함</h2>
        <p>
          맛집지도는 본인 계정으로 음식점을 검색하고, 방문 목적·음식 종류·대표
          메뉴 등 직접 만든 분류와 함께 저장하는 개인용 서비스입니다. 저장
          버튼을 눌러야 내 보관함에 추가됩니다.
        </p>
        <p>
          내 보관함은 계정별로 구분됩니다. 공개 회원가입, 보관함 공유,
          예약·주문·결제, 리뷰 작성 기능은 제공하지 않습니다.
        </p>
      </section>
      <section>
        <h2>로그인과 계정 관리</h2>
        <p>
          최초 설정 절차로 만든 아이디와 비밀번호로 로그인합니다. 비밀번호
          변경·재설정 시 모든 로그인 세션과 기존 복구 키를 폐기합니다. 복구 키는
          로그인 후 계정 보안에서 발급하고 별도로 보관해주세요.
        </p>
        <p>
          비밀번호와 복구 키를 모두 잃은 경우 화면에서 계정을 복구할 수
          없습니다. 최초 설정 토큰은 복구 키가 아닙니다.
        </p>
      </section>
      <section>
        <h2>장소 정보와 외부 서비스</h2>
        <p>
          실제 검색·지도 모드에서는 Google Places와 Google Maps를 사용합니다.
          사용 시{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 서비스 약관
          </a>{" "}
          및{" "}
          <a
            href="https://maps.google.com/help/terms_maps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps 추가 서비스 약관
          </a>
          이 함께 적용됩니다. 모의 모드는 테스트 장소와 모의 지도를 표시합니다.
        </p>
        <p>
          음식점의 이름·주소·위치 등 외부 정보는 변경되거나 조회되지 않을 수
          있습니다. 직접 지정한 대표 메뉴·방문 목적은 사용자의 분류이며 업체의
          공식 정보나 검증된 평가를 뜻하지 않습니다.
        </p>
        <p>
          검색과 상세 조회는 사용량 제한 또는 외부 장애로 중단될 수 있습니다.
          제한이 걸려도 이미 저장한 Place ID와 내 분류를 자동으로 삭제하지
          않습니다. 위치 권한을 거부하면 기본 지도를 표시합니다.
        </p>
      </section>
      <section>
        <h2>내 데이터와 서비스 범위</h2>
        <p>
          저장한 맛집과 카테고리는 화면에서 수정하거나 삭제할 수 있습니다.
          Google의 원본 장소를 수정·삭제하는 기능은 아닙니다. 현재 계정 자체
          삭제 요청과 운영 백업 파기 절차는 확정 전입니다.
        </p>
        <p>
          실제 데이터 취급 내용은 <a href="/privacy">데이터 처리 안내</a>에서
          확인할 수 있습니다. 공개 운영 범위나 데이터 처리 방식이 바뀌면 안내도
          함께 갱신해야 합니다.
        </p>
      </section>
    </ServicePolicy>
  );
}
