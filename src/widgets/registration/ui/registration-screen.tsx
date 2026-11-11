import { SelectedPlaceMap } from "@/features/map/components/SelectedPlaceMap";
import Link from "next/link";
import { PlaceRegistrationPanel } from "@/features/place-registration/components/PlaceRegistrationPanel";
import { Icon } from "@/shared/ui/icon";
import { InstallAppButton } from "@/features/pwa/components/InstallAppButton";
export function RegistrationScreen() {
  const hasMapKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) && process.env.GOOGLE_MAPS_BROWSER_ENABLED === "true";
  return (
    <div className="food-map-app">
      <a href="#registration" className="skip-link">
        맛집 등록으로 건너뛰기
      </a>
      <header className="app-header">
        <Link href="/map" className="brand" aria-label="맛집지도 홈">
          <span className="brand-symbol">
            <Icon name="pin" width={25} height={25} />
          </span>
          <span>맛집지도</span>
        </Link>
        <span className="header-divider" />
        <p className="header-description">발견한 맛집을 카테고리로 정리해요</p>
        <InstallAppButton />
      </header>
      <main className="workspace">
        <PlaceRegistrationPanel />
        <section
          className={`map-pane${hasMapKey ? "" : " map-placeholder"}`}
          aria-label="주변 지도"
        >
          <SelectedPlaceMap apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} />
          <div className="map-notice">
            <span className="notice-icon">
              <Icon name="pin" />
            </span>
            <div>
              <h2>지도 미리보기</h2>
              <p>등록한 맛집의 지도 표시는 준비 중이에요.</p>
            </div>
          </div>
          <span className="map-status-tag">
            {hasMapKey ? "주변 지도" : "예시 배경 · 실제 지도가 아니에요"}
          </span>
        </section>
      </main>
    </div>
  );
}
