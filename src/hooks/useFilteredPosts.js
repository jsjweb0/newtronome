import { useMemo } from "react";

export default function useFilteredPosts(posts, {
    keyword,
    dateSort,
    kindFilter,
    regionCode,
    sexFilter,
    statusFilter,
    showOnlyLiked,
    likedIds,
}) {
    return useMemo(() => {
        let filtered = [...posts];

        // 정렬
        filtered.sort((a, b) =>
            dateSort ? Number(a.noticeSdt) - Number(b.noticeEdt) : Number(b.noticeEdt) - Number(a.noticeSdt)
        );

        // 필터
        if (kindFilter && kindFilter !== "all") {
            filtered = filtered.filter(p => {
                const kind = p.upKindCd || "";
                if (kindFilter === "dog") return kind === "417000";
                if (kindFilter === "cat") return kind === "422400";
                return kind !== "417000" && kind !== "422400";
            });
        }

        if (regionCode) {
            filtered = filtered.filter(p => p.orgNm?.startsWith(regionCode));
        }

        if (sexFilter) {
            filtered = filtered.filter(p => p.sexCd === sexFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(p => p.processState === statusFilter);
        }

        if (showOnlyLiked && likedIds) {
            filtered = filtered.filter(p => likedIds.includes(p.desertionNo?.toString()));
        }

        if (keyword) {
            filtered = filtered.filter(p =>
                (p.kindNm || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (p.colorCd || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (p.orgNm || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (p.processState || "").toLowerCase().includes(keyword.toLowerCase())
            );
        }

        return filtered;
    }, [posts, keyword, dateSort, kindFilter, regionCode, sexFilter, statusFilter, showOnlyLiked, likedIds]);
}