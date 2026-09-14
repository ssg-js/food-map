"use client";

import { useCallback, useState, type FormEvent } from "react";

import type { PlaceSearchResult } from "@/entities/place/type/place";
import { MIN_PLACE_SEARCH_QUERY_LENGTH } from "@/shared/constants/place-search";

import { useCategories } from "../hooks/useCategories";
import { useCreateCategory } from "../hooks/useCreateCategory";
import { usePlaceSearch } from "../hooks/usePlaceSearch";
import { useSaveRestaurant } from "../hooks/useSaveRestaurant";

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function PlaceRegistrationPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const placeSearch = usePlaceSearch(submittedQuery);
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const saveRestaurant = useSaveRestaurant();

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittedQuery(searchInput.trim());
      setSelectedPlace(null);
      saveRestaurant.reset();
    },
    [saveRestaurant, searchInput],
  );

  const handleSelectPlace = useCallback(
    (place: PlaceSearchResult) => {
      setSelectedPlace(place);
      setSelectedCategoryIds([]);
      saveRestaurant.reset();
    },
    [saveRestaurant],
  );

  const handleToggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds((currentIds) =>
      currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId],
    );
  }, []);

  const handleCreateCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;

    createCategory.mutate(name, {
      onSuccess: (category) => {
        setNewCategoryName("");
        setSelectedCategoryIds((currentIds) =>
          currentIds.includes(category.id)
            ? currentIds
            : [...currentIds, category.id],
        );
      },
    });
  }, [createCategory, newCategoryName]);

  const handleSaveRestaurant = useCallback(() => {
    if (!selectedPlace) return;

    saveRestaurant.mutate({
      googlePlaceId: selectedPlace.placeId,
      categoryIds: selectedCategoryIds,
    });
  }, [saveRestaurant, selectedCategoryIds, selectedPlace]);

  return (
    <section className="absolute left-4 right-4 top-4 z-50 max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <form onSubmit={handleSearchSubmit}>
        <label
          htmlFor="place-search"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          장소 검색
        </label>
        <div className="flex gap-2">
          <input
            id="place-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`${MIN_PLACE_SEARCH_QUERY_LENGTH}자 이상 입력 후 검색`}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            disabled={searchInput.trim().length < MIN_PLACE_SEARCH_QUERY_LENGTH}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950"
          >
            검색
          </button>
        </div>
      </form>

      {placeSearch.isFetching && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          장소를 검색하는 중입니다...
        </p>
      )}

      {placeSearch.isError && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {toErrorMessage(placeSearch.error, "장소 검색에 실패했습니다.")}
        </p>
      )}

      {placeSearch.isSuccess && placeSearch.data.length === 0 && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          검색 결과가 없습니다.
        </p>
      )}

      {placeSearch.isSuccess && placeSearch.data.length > 0 && (
        <ul className="mt-3 flex max-h-48 flex-col gap-1 overflow-y-auto">
          {placeSearch.data.map((place) => {
            const isSelected = selectedPlace?.placeId === place.placeId;

            return (
              <li key={place.placeId}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectPlace(place)}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    isSelected
                      ? "bg-orange-100 dark:bg-orange-900/40"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {place.name}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {place.address}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedPlace && (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {selectedPlace.name}
          </p>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            {selectedPlace.address}
          </p>

          <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            카테고리 선택
          </span>

          {categories.isError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {toErrorMessage(
                categories.error,
                "카테고리 목록을 불러오지 못했습니다.",
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {(categories.data ?? []).map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleToggleCategory(category.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    isSelected
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="새 카테고리 이름"
              aria-label="새 카테고리 이름"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategory.isPending}
              className="shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-50"
            >
              추가
            </button>
          </div>

          {createCategory.isError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {toErrorMessage(
                createCategory.error,
                "카테고리를 생성하지 못했습니다.",
              )}
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveRestaurant}
            disabled={saveRestaurant.isPending}
            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition disabled:opacity-40"
          >
            맛집으로 저장
          </button>

          {saveRestaurant.isError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {toErrorMessage(saveRestaurant.error, "맛집을 저장하지 못했습니다.")}
            </p>
          )}

          {saveRestaurant.isSuccess && (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              저장했습니다. 카테고리{" "}
              {saveRestaurant.data.categories.length}개가 연결되었습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
