"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MAX_CATEGORY_LENGTH,
  MIN_SEARCH_LENGTH,
  normalizeCategoryName,
  isSearchBlocked,
  type Place,
  type RegistrationApi,
  type Category,
  type EditableCategoryKind,
  type RegistrationApiError,
} from "./api";
export function useRegistration(api: RegistrationApi) {
  const queryClient = useQueryClient();
  const selectionVersion = useRef(0);
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKind, setNewCategoryKind] =
    useState<EditableCategoryKind | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [searchNotice, setSearchNotice] = useState<RegistrationApiError | null>(
    null,
  );
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
      queryClient.setQueryData<Category[]>(
        ["registration", "categories"],
        (previous) =>
          [
            ...(previous ?? []).filter((item) => item.id !== category.id),
            category,
          ].sort((a, b) => a.name.localeCompare(b.name, "ko")),
      );
      setSelectedCategoryIds((ids) => [...new Set([...ids, category.id])]);
      setNewCategoryName("");
      setNewCategoryKind(null);
    },
  });
  const save = useMutation({
    mutationFn: api.save,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
  const existing = useMutation({
    mutationFn: async ({
      place,
      version,
    }: {
      place: Place;
      version: number;
    }) => ({ restaurant: await api.findSaved(place.placeId), version }),
    retry: false,
    onSuccess: ({ restaurant, version }) => {
      if (version === selectionVersion.current)
        setSelectedCategoryIds(restaurant?.categories.map((c) => c.id) ?? []);
    },
  });
  const searchMutation = useMutation({
    mutationFn: api.search,
    retry: false,
    gcTime: 0,
    onSuccess: () => {
      selectionVersion.current++;
      setSelectedPlace(null);
      setSelectedCategoryIds([]);
      setNewCategoryName("");
      setNewCategoryKind(null);
      setValidationMessage("");
      save.reset();
      createCategory.reset();
      existing.reset();
    },
    onError: (error) => {
      if (isSearchBlocked(error)) setSearchNotice(error);
    },
  });
  const search = {
    ...searchMutation,
    isFetching: searchMutation.isPending,
    refetch: () => {
      if (!searchMutation.isPending && submittedQuery)
        searchMutation.mutate(submittedQuery);
    },
  };
  const busy = createCategory.isPending || save.isPending || existing.isPending;
  const canSearch =
    !busy &&
    !search.isFetching &&
    searchInput.trim().length >= MIN_SEARCH_LENGTH;
  const canSave =
    selectedPlace !== null &&
    categories.isSuccess &&
    existing.isSuccess &&
    !busy &&
    !search.isFetching &&
    !save.isSuccess &&
    !newCategoryName.trim();
  function submitSearch() {
    if (!canSearch) return;
    const q = searchInput.trim();
    setSubmittedQuery(q);
    setSearchNotice(null);
    searchMutation.mutate(q);
  }
  function selectPlace(place: Place) {
    if (busy || search.isFetching || selectedPlace?.placeId === place.placeId)
      return;
    const version = ++selectionVersion.current;
    setSelectedPlace(place);
    setSelectedCategoryIds([]);
    setNewCategoryName("");
    setNewCategoryKind(null);
    setValidationMessage("");
    save.reset();
    createCategory.reset();
    existing.mutate({ place, version });
  }
  function retryExisting() {
    if (selectedPlace && !existing.isPending)
      existing.mutate({
        place: selectedPlace,
        version: selectionVersion.current,
      });
  }
  function toggleCategory(id: string) {
    if (busy || !existing.isSuccess) return;
    setSelectedCategoryIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
    save.reset();
  }
  function openCategory(kind: EditableCategoryKind | null) {
    if (busy) return;
    setNewCategoryKind(kind);
    setNewCategoryName("");
    setValidationMessage("");
    createCategory.reset();
  }
  function addCategory() {
    if (busy || !selectedPlace || !newCategoryKind || !existing.isSuccess)
      return;
    const name = normalizeCategoryName(newCategoryName);
    if (!name || name.length > MAX_CATEGORY_LENGTH) {
      setValidationMessage(
        `카테고리는 1~${MAX_CATEGORY_LENGTH}자로 입력해주세요.`,
      );
      return;
    }
    const found = categories.data?.find(
      (c) =>
        c.kind === newCategoryKind && normalizeCategoryName(c.name) === name,
    );
    save.reset();
    if (found) {
      setSelectedCategoryIds((ids) => [...new Set([...ids, found.id])]);
      setNewCategoryName("");
      setNewCategoryKind(null);
      setValidationMessage("이미 있는 카테고리를 선택했어요.");
      return;
    }
    setValidationMessage("");
    createCategory.mutate({ name, kind: newCategoryKind });
  }
  function savePlace() {
    if (canSave && selectedPlace)
      save.mutate({
        googlePlaceId: selectedPlace.placeId,
        categoryIds: selectedCategoryIds,
        expectedUpdatedAt: existing.data?.restaurant?.updatedAt,
      });
  }
  function startAgain() {
    if (busy) return;
    selectionVersion.current++;
    setSearchInput("");
    setSubmittedQuery("");
    setSelectedPlace(null);
    setSelectedCategoryIds([]);
    setNewCategoryName("");
    setNewCategoryKind(null);
    setValidationMessage("");
    save.reset();
    createCategory.reset();
    existing.reset();
    searchMutation.reset();
  }
  return {
    searchInput,
    setSearchInput,
    submittedQuery,
    selectedPlace,
    selectedCategoryIds,
    newCategoryName,
    setNewCategoryName,
    newCategoryKind,
    openCategory,
    validationMessage,
    search,
    categories,
    createCategory,
    save,
    existing,
    retryExisting,
    busy,
    canSearch,
    canSave,
    submitSearch,
    selectPlace,
    toggleCategory,
    addCategory,
    savePlace,
    startAgain,
    searchNotice,
    dismissSearchNotice: () => setSearchNotice(null),
  };
}
export type RegistrationController = ReturnType<typeof useRegistration>;
