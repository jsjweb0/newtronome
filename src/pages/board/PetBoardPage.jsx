import {getDocs, collection} from "firebase/firestore";
import {db} from "../../firebase";
import {useSearchParams} from 'react-router-dom';
import {useToast} from '../../contexts/useToast.js';
import {useEffect, useMemo, useState} from "react";
import {useAuth} from "../../contexts/useAuth.js";
import PetSearchBar from "../../components/board/PetSearchBar.jsx";
import SortButtonGroup from "../../components/board/SortButtonGroup.jsx";
import Pagination from "../../components/board/Pagination.jsx";
import PetPostList from "../../components/board/PetPostList.jsx";
import PetPostListSkeleton from "../../components/board/PetPostListSkeleton.jsx";
import {getCurrentPageItems, getTotalPages} from "../../utils/pagination.js";

export default function PetBoardPage() {
    const { showToast } = useToast();
    const {user} = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedIds, setLikedIds] = useState([]);
    const [regionOptions, setRegionOptions] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();

    const pageParam = parseInt(searchParams.get('page')) || 1;
    const keywordParam = searchParams.get('keyword') || '';
    const sortParam = searchParams.get('sort') === 'asc';
    const regionCodeParam = searchParams.get('region') || '';
    const kindFilterParam = searchParams.get('kind') || 'all';
    const sexFilterParam = searchParams.get('sex') || '';
    const statusFilterParam = searchParams.get('status') || '';
    const likedParam = searchParams.get('liked') === 'true';

    const [currentPage, setCurrentPage] = useState(pageParam);
    const [searchKeyword, setSearchKeyword] = useState(keywordParam);
    const [dateSort, setDateSort] = useState(sortParam);
    const [regionCode, setRegionCode] = useState(regionCodeParam);
    const [kindFilter, setKindFilter] = useState(kindFilterParam);
    const [sexFilter, setSexFilter] = useState(sexFilterParam);
    const [statusFilter, setStatusFilter] = useState(statusFilterParam);
    const [showOnlyLiked, setShowOnlyLiked] = useState(likedParam);


    useEffect(() => {
        const fetchPets = async () => {
            const serviceKey = "l7ngeStfaLO1QpNc4njFsAoLLALk//VGMTfhTwFidxSvqRMd4YLHKsp2u28o5zpEPlYjmr5y5UOpSt4xphNqkA=="
            try {
                const res = await fetch(`https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2?serviceKey=${serviceKey}&pageNo=1&numOfRows=30&_type=json`, {
                    headers: {
                        Accept: 'application/json',
                    },
                });
                const data = await res.json();
                const posts = data.response?.body?.items?.item || [];

                setPosts(posts);

            } catch (e) {
                console.error("펫 데이터 오류", e);
                showToast({message: "펫 데이터를 불러오지 못했어요.", type: "error"});
            } finally {
                setLoading(false); // 로딩 끝
            }
        };

        fetchPets();

    }, []);

    useEffect(() => {
        const fetchRegions = async () => {
            const serviceKey = "l7ngeStfaLO1QpNc4njFsAoLLALk//VGMTfhTwFidxSvqRMd4YLHKsp2u28o5zpEPlYjmr5y5UOpSt4xphNqkA==";
            const res = await fetch(`https://apis.data.go.kr/1543061/abandonmentPublicService_v2/sido_v2?serviceKey=${serviceKey}&numOfRows=100&_type=json`);
            const data = await res.json();
            const regionList = data.response?.body?.items?.item || [];
            setRegionOptions(regionList);
        };

        fetchRegions();
    }, []);

    useEffect(() => {
        const fetchLikedPosts = async () => {
            if (!user) return;

            try {
                const snap = await getDocs(collection(db, 'pet'));
                const result = [];

                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.likedUsers?.includes(user.email)) {
                        result.push(docSnap.id); // 문서 ID = desertionNo
                    }
                });

                setLikedIds(result);
            } catch (err) {
                console.error("좋아요 불러오기 실패", err);
                showToast({message: "좋아요 정보를 불러오지 못했어요.", type: "error"});
            }
        };

        fetchLikedPosts();
    }, [user]);

    const filteredPosts = useMemo(() => {
        let filtered = [...posts];

        if (regionCode) {
            filtered = filtered.filter(p => p.orgNm?.startsWith(regionCode));
        }

        filtered = filtered
            .sort((a, b) =>
                dateSort
                    ? Number(a.noticeSdt) - Number(b.noticeEdt)
                    : Number(b.noticeEdt) - Number(a.noticeSdt)
            )
            .filter(post => {
                // 종 필터 적용
                const kind = post.upKindCd || "";
                if (kindFilter === "dog") return kind === "417000";
                if (kindFilter === "cat") return kind === "422400";
                if (kindFilter === "etc") return kind !== "417000" && kind !== "422400";
                return true;
            })
            .filter(post => !sexFilter || post.sexCd === sexFilter)
            .filter(post => !statusFilter || post.processState === statusFilter)
            .filter(post =>
                (post.kindNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (post.colorCd || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (post.careNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (post.orgNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (post.processState || '').toLowerCase().includes(searchKeyword.toLowerCase())
            )
            .filter(post => !showOnlyLiked || likedIds.includes(post.desertionNo?.toString()));

        const uniqueMap = new Map();
        filtered.forEach(post => uniqueMap.set(post.desertionNo, post));
        return Array.from(uniqueMap.values());
    }, [posts, searchKeyword, dateSort, regionCode, kindFilter, sexFilter, statusFilter, showOnlyLiked]);

    const itemsPerPage = 12;
    const totalPages = getTotalPages(filteredPosts.length, itemsPerPage);
    const currentItems = getCurrentPageItems(filteredPosts, currentPage, itemsPerPage);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    useEffect(() => {
        const pageFromParams = parseInt(searchParams.get('page'));
        const keywordFromParams = searchParams.get('keyword') || '';
        const sortFromParams = searchParams.get('sort') === 'asc';

        setCurrentPage(!isNaN(pageFromParams) ? pageFromParams : 1);
        setSearchKeyword(keywordFromParams);
        setDateSort(sortFromParams);
    }, [searchParams]);

    useEffect(() => {
        const pageFromQuery = searchParams.get("page");
        const isFilterChanged = [
            searchKeyword,
            dateSort,
            regionCode,
            kindFilter,
            sexFilter,
            statusFilter,
            showOnlyLiked
        ];

        // 필터 바뀌었고, page 쿼리도 없음 → 리셋
        if (!pageFromQuery && isFilterChanged.some(v => v)) {
            setCurrentPage(1);
        }
    }, [searchKeyword, dateSort, regionCode, kindFilter, sexFilter, statusFilter, showOnlyLiked]);

    useEffect(() => {
        const newParams = new URLSearchParams();
        newParams.set('page', '1');
        newParams.set('keyword', searchKeyword);
        newParams.set('sort', dateSort ? 'asc' : 'desc');
        if (regionCode) newParams.set('region', regionCode);
        if (kindFilter !== 'all') newParams.set('kind', kindFilter);
        if (sexFilter) newParams.set('sex', sexFilter);
        if (statusFilter) newParams.set('status', statusFilter);
        if (showOnlyLiked) newParams.set('liked', 'true');

        setSearchParams(newParams, { replace: false });
        console.log("🔁 URL 쿼리 갱신됨:", newParams.toString());
    }, [currentPage, searchKeyword, dateSort, regionCode, kindFilter, sexFilter, statusFilter, showOnlyLiked]);

    useEffect(() => {
        if (loading) {
            showToast({
                message: "리스트를 불러오는 중입니다.",
                type: "info"
            });
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="max-w-[85rem] mx-auto mb-8 px-4">
                <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
                    보호동물
                </h2>
                <PetPostListSkeleton/>
            </div>
        )
    }

    return (
        <div className="max-w-[85rem] mx-auto mb-8 px-4">
            <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
                보호동물
            </h2>
            <PetSearchBar posts={posts}
                          filteredPosts={filteredPosts}
                          searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword}
                          filter={kindFilter} setFilter={setKindFilter}
                          regionCode={regionCode} setRegionCode={setRegionCode} regionOptions={regionOptions}
                          sexFilter={sexFilter} setSexFilter={setSexFilter}
                          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                          showOnlyLiked={showOnlyLiked} setShowOnlyLiked={setShowOnlyLiked}
            />
            <SortButtonGroup
                posts={posts}
                setPosts={setPosts}
                initialNotice={posts}
                dateSort={dateSort}
                setDateSort={setDateSort}
            />
            <PetPostList
                posts={posts}
                filteredPosts={currentItems}
                setPosts={setPosts}
                searchKeyword={searchKeyword}
                currentPage={currentPage}
                dateSort={dateSort}
                kindFilter={kindFilter}
                setKindFilter={setKindFilter}
            />
            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

        </div>
    )
}
