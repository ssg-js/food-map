import { Icon } from "@/shared/ui/icon";

interface MapCurrentLocationButtonProps {
  isDisabled: boolean;
  onClick: () => void;
}

export function MapCurrentLocationButton({
  isDisabled,
  onClick,
}: MapCurrentLocationButtonProps) {
  return (
    <button
      type="button"
      className="map-location-button"
      disabled={isDisabled}
      aria-label="현재 위치로 지도 이동"
      title={
        isDisabled ? "현재 위치를 확인할 수 없습니다" : "현재 위치로 지도 이동"
      }
      onClick={onClick}
    >
      <Icon name="location" />
    </button>
  );
}
