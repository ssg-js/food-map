interface MapEmptyStateProps {
  onReset: () => void;
}

export function MapEmptyState({ onReset }: MapEmptyStateProps) {
  return (
    <div className="absolute left-1/2 top-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 p-5 text-center shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        검색 결과가 없습니다
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        다른 검색어를 입력하거나 카테고리 필터를 초기화해보세요.
      </p>
      <button
        type="button"
        className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
        onClick={onReset}
      >
        필터 초기화
      </button>
    </div>
  );
}
