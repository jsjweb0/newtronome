import clsx from "clsx";

export function viewModeClass(viewMode, grid, list) {
    return viewMode === "grid" ? grid : list;
}

export function viewModeMultiClass(viewMode, classMap) {
    return classMap[viewMode] || "";
}
