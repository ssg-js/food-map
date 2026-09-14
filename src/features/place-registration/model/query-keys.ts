export const categoryQueryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryQueryKeys.all, "list"] as const,
};

export const placeQueryKeys = {
  all: ["places"] as const,
  search: (query: string) => [...placeQueryKeys.all, "search", query] as const,
};

export const restaurantQueryKeys = {
  all: ["restaurants"] as const,
  list: () => [...restaurantQueryKeys.all, "list"] as const,
};
