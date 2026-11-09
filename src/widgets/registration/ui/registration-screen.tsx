import Link from "next/link";
import { PlaceRegistrationPanel } from "@/features/place-registration/components/PlaceRegistrationPanel";
import { MapView } from "@/features/map/components/MapView";
import { MapProvider } from "@/widgets/map";
import { Icon } from "@/shared/ui/icon";
import { InstallAppButton } from "@/features/pwa/components/InstallAppButton";
export function RegistrationScreen() {
  const hasMapKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
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
          {hasMapKey && (
            <MapProvider providerType="google">
              <MapView />
            </MapProvider>
          )}
          {!hasMapKey && (
            <div className="placeholder-caption">
              지도 연결을 준비하고 있어요.
              <br />
              장소 검색과 등록은 계속할 수 있어요.
            </div>
          )}
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
