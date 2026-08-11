export interface RestaurantBoundsState {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RestaurantFilterState {
  searchTerm: string;
  selectedCategory: string | null;
  bounds: RestaurantBoundsState | null;
}

export interface RestaurantCategoryOption {
  name: string;
  totalCount: number;
  boundsCount: number;
}

export function hasActiveRestaurantFilter(
  filter: RestaurantFilterState,
): boolean {
  return filter.searchTerm.trim().length > 0 || filter.selectedCategory !== null;
}
