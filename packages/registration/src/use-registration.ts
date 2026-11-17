"use client";
import { personalQueryKeys } from "./personal-query-keys";
import { viewportKey, type MapViewport } from "./viewport";
import { useCallback, useRef, useState } from "react";
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
export function useRegistration(api: RegistrationApi, ownerId: string) {
  const queryClient = useQueryClient();
  const selectionVersion = useRef(0);
  const [viewport, setArea] = useState<MapViewport | null>(null);
  const [searchedViewport, setSearchedViewport] = useState<MapViewport | null>(
    null,
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const setViewport = useCallback(
    (v: MapViewport) =>
      setArea((old) => (old && viewportKey(old) === viewportKey(v) ? old : v)),
    [],
  );
  const viewportDirty = !!(
    viewport &&
    searchedViewport &&
    viewportKey(viewport) !== viewportKey(searchedViewport)
  );
  const [searchInput, setSearchInput] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [dishQuery, setDishQuery] = useState("");
  const composedQuery = [searchInput, foodQuery, dishQuery]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" ");
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
    queryKey: personalQueryKeys.categories(ownerId),
    queryFn: api.categories,
    enabled: selectedPlace !== null,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const createCategory = useMutation({
    mutationKey: personalQueryKeys.registration(ownerId, "create-category"),
    mutationFn: api.createCategory,
    retry: false,
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(
        personalQueryKeys.categories(ownerId),
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
    mutationKey: personalQueryKeys.registration(ownerId, "save"),
    mutationFn: api.save,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.catalog(ownerId),
      });
      void queryClient.invalidateQueries({
        queryKey: personalQueryKeys.categories(ownerId),
      });
    },
  });
  const existing = useMutation({
    mutationKey: personalQueryKeys.registration(ownerId, "find-saved"),
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
    mutationKey: personalQueryKeys.registration(ownerId, "search"),
    mutationFn: ({
      query,
      viewport,
    }: {
      query: string;
      viewport: MapViewport;
    }) => api.search(query, viewport),
    retry: false,
    gcTime: 0,
    onSuccess: (_items, variables) => {
      setSearchedViewport(variables.viewport);
      setHoveredId(null);
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
      if (!searchMutation.isPending && submittedQuery && viewport)
        searchMutation.mutate({ query: submittedQuery, viewport });
    },
  };
  const busy = createCategory.isPending || save.isPending || existing.isPending;
  const canSearch =
    !!viewport &&
    !busy &&
    !search.isFetching &&
    composedQuery.length >= MIN_SEARCH_LENGTH &&
    composedQuery.length <= 200;
  const canSave =
    selectedPlace !== null &&
    !!categories.data?.some(
      (c) => selectedCategoryIds.includes(c.id) && c.kind !== "UNCLASSIFIED",
    ) &&
    categories.isSuccess &&
    existing.isSuccess &&
    !busy &&
    !search.isFetching &&
    !save.isSuccess &&
    !newCategoryName.trim();
  function submitSearch() {
    if (!canSearch || !viewport) return;
    const q = composedQuery;
    setSubmittedQuery(q);
    setSearchNotice(null);
    searchMutation.mutate({ query: q, viewport });
  }
  function searchHere() {
    if (!viewport || !submittedQuery || busy || searchMutation.isPending)
      return;
    setSearchNotice(null);
    searchMutation.mutate({ query: submittedQuery, viewport });
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
    setSearchedViewport(null);
    setHoveredId(null);
  }
  return {
    foodQuery,
    setFoodQuery,
    dishQuery,
    setDishQuery,
    composedQuery,
    viewport,
    setViewport,
    viewportDirty,
    hoveredId,
    setHoveredId,
    searchHere,
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
