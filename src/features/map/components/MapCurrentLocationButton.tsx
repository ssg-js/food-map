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
      className="absolute bottom-6 right-4 z-30 rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      disabled={isDisabled}
      aria-label="현재 위치로 지도 이동"
      title={
        isDisabled
          ? "현재 위치를 확인할 수 없습니다"
          : "현재 위치로 지도 이동"
      }
      onClick={onClick}
    >
      현재 위치
    </button>
  );
}
