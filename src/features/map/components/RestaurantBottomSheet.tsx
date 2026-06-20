import type { MapRestaurant } from "../model/types";

interface RestaurantBottomSheetProps {
  restaurant: MapRestaurant | null;
  onClose: () => void;
}

export function RestaurantBottomSheet({
  restaurant,
  onClose,
}: RestaurantBottomSheetProps) {
  const isOpen = restaurant !== null;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-black/30"
          aria-label="바텀시트 닫기"
          onClick={onClose}
        />
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-zinc-900 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-labelledby={isOpen ? "restaurant-bottom-sheet-title" : undefined}
      >
        {restaurant && (
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <span className="mb-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                  {restaurant.category}
                </span>
                <h2
                  id="restaurant-bottom-sheet-title"
                  className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {restaurant.name}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="닫기"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            <div className="mb-3 flex items-center gap-1 text-sm font-medium text-amber-600">
              <span aria-hidden="true">★</span>
              <span>{restaurant.rating.toFixed(1)}</span>
            </div>
            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
              {restaurant.address}
            </p>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {restaurant.description}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
