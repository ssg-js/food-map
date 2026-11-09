"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MAX_CATEGORY_LENGTH,
  MIN_SEARCH_LENGTH,
  normalizeCategoryName,
  type Place,
  type RegistrationApi,
} from "./api";

export function useRegistration(api: RegistrationApi) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const search = useQuery({
    queryKey: ["registration", "search", submittedQuery],
    queryFn: () => api.search(submittedQuery),
    enabled: submittedQuery.length >= MIN_SEARCH_LENGTH,
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const categories = useQuery({
    queryKey: ["registration", "categories"],
    queryFn: api.categories,
    enabled: selectedPlace !== null,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const createCategory = useMutation({
    mutationFn: api.createCategory,
    retry: false,
    onSuccess: (category) => {
      queryClient.setQueryData(
        ["registration", "categories"],
        (previous: import("./api").Category[] | undefined) =>
          [
            ...(previous ?? []).filter((item) => item.id !== category.id),
            category,
          ].sort((a, b) => a.name.localeCompare(b.name, "ko")),
      );
      setSelectedCategoryIds((ids) => [...new Set([...ids, category.id])]);
      setNewCategoryName("");
    },
  });
  const save = useMutation({
    mutationFn: api.save,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
  const busy = createCategory.isPending || save.isPending;
  const canSearch =
    !busy &&
    !search.isFetching &&
    searchInput.trim().length >= MIN_SEARCH_LENGTH;
  const canSave =
    selectedPlace !== null && categories.isSuccess && !busy && !save.isSuccess;

  function submitSearch() {
    if (!canSearch) return;
    const query = searchInput.trim();
    setSelectedPlace(null);
    setSelectedCategoryIds([]);
    setNewCategoryName("");
    setValidationMessage("");
    save.reset();
    createCategory.reset();
    if (query === submittedQuery && search.isError) void search.refetch();
    setSubmittedQuery(query);
  }
  function selectPlace(place: Place) {
    if (busy || selectedPlace?.placeId === place.placeId) return;
    setSelectedPlace(place);
    setSelectedCategoryIds([]);
    setNewCategoryName("");
    setValidationMessage("");
    save.reset();
    createCategory.reset();
  }
  function toggleCategory(id: string) {
    if (busy) return;
    setSelectedCategoryIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
    save.reset();
  }
  function addCategory() {
    if (busy || !selectedPlace) return;
    const name = normalizeCategoryName(newCategoryName);
    if (!name || name.length > MAX_CATEGORY_LENGTH) {
      setValidationMessage(
        `카테고리는 1~${MAX_CATEGORY_LENGTH}자로 입력해주세요.`,
      );
      return;
    }
    const existing = categories.data?.find(
      (category) => normalizeCategoryName(category.name) === name,
    );
    if (existing) {
      setSelectedCategoryIds((ids) => [...new Set([...ids, existing.id])]);
      setNewCategoryName("");
      setValidationMessage("이미 있는 카테고리를 선택했어요.");
      save.reset();
      return;
    }
    setValidationMessage("");
    save.reset();
    createCategory.mutate(name);
  }
  function savePlace() {
    if (!canSave || !selectedPlace) return;
    save.mutate({
      googlePlaceId: selectedPlace.placeId,
      categoryIds: selectedCategoryIds,
    });
  }
  function startAgain() {
    if (busy) return;
    setSearchInput("");
    setSubmittedQuery("");
    setSelectedPlace(null);
    setSelectedCategoryIds([]);
    setNewCategoryName("");
    setValidationMessage("");
    save.reset();
    createCategory.reset();
  }
  return {
    searchInput,
    setSearchInput,
    submittedQuery,
    selectedPlace,
    selectedCategoryIds,
    newCategoryName,
    setNewCategoryName,
    validationMessage,
    search,
    categories,
    createCategory,
    save,
    busy,
    canSearch,
    canSave,
    submitSearch,
    selectPlace,
    toggleCategory,
    addCategory,
    savePlace,
    startAgain,
  };
}
export type RegistrationController = ReturnType<typeof useRegistration>;
