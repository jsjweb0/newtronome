import { useSearchParams } from "react-router-dom";

export default function useBoardQueryParams(defaults = {}) {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get("page")) || defaults.page || 1;
    const keyword = searchParams.get("keyword") || defaults.keyword || "";
    const sort = searchParams.get("sort") === "asc";

    return {
        page,
        keyword,
        sort,
        setSearchParams,
        searchParams,
    };
}
