interface MapSearchControlsProps {
  categories: string[];
  hasActiveFilter: boolean;
  resultCount: number;
  searchTerm: string;
  selectedCategory: string | null;
  totalCount: number;
  onCategoryChange: (category: string | null) => void;
  onReset: () => void;
  onSearchTermChange: (searchTerm: string) => void;
}

export function MapSearchControls({
  categories,
  hasActiveFilter,
  resultCount,
  searchTerm,
  selectedCategory,
  totalCount,
  onCategoryChange,
  onReset,
  onSearchTermChange,
}: MapSearchControlsProps) {
  return (
    <section className="absolute left-4 right-4 top-4 z-50 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <label
        htmlFor="restaurant-search"
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
      >
        맛집 검색
      </label>
      <input
        id="restaurant-search"
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="이름, 주소, 카테고리로 검색"
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            selectedCategory === null
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
          aria-pressed={selectedCategory === null}
          onClick={() => onCategoryChange(null)}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              selectedCategory === category
                ? "bg-orange-500 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
            aria-pressed={selectedCategory === category}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {resultCount}개 표시 중 / 전체 {totalCount}개
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            onClick={onReset}
          >
            필터 초기화
          </button>
        )}
      </div>
    </section>
  );
}
