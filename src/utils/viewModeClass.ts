export type ViewMode = 'grid' | 'list';

type ViewModeClassMap = Partial<Record<ViewMode, string>>;

export function viewModeClass(
  viewMode: ViewMode,
  grid: string,
  list = '',
): string {
  return viewMode === 'grid' ? grid : list;
}

export function viewModeMultiClass(
  viewMode: ViewMode,
  classMap: ViewModeClassMap,
): string {
  return classMap[viewMode] || '';
}
