import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PetSearchBar from '../../components/board/PetSearchBar';
import SortButtonGroup from '../../components/board/SortButtonGroup';
import Pagination from '../../components/board/Pagination';
import PetPostList from '../../components/board/PetPostList';
import PetPostListSkeleton from '../../components/board/PetPostListSkeleton';
import { getCurrentPageItems, getTotalPages } from '../../utils/pagination';
import type { AnimalKind } from '../../components/board/AnimalKindFilter';
import type { SexFilterValue } from '../../components/board/SexFilter';
import type { StatusFilterValue } from '../../components/board/StatusFilter';
import {
  parsePetPostsResponse,
  parseRegionOptionsResponse,
  type PetPost,
  type RegionOption,
} from '../../utils/petApi';
import { fetchPetPosts, fetchPetRegions } from '../../utils/petApiClient';
import { RotateCcw } from 'lucide-react';

function getAnimalKind(value: string | null): AnimalKind {
  return value === 'dog' || value === 'cat' || value === 'etc' ? value : 'all';
}

function getSexFilter(value: string | null): SexFilterValue {
  return value === 'M' || value === 'F' || value === 'Q' ? value : '';
}

function getStatusFilter(value: string | null): StatusFilterValue {
  return value === '보호중' || value === '종료(반환)' ? value : '';
}

export default function PetBoardPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const userUid = user?.uid;
  const [posts, setPosts] = useState<PetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10) || 1;
  const keywordParam = searchParams.get('keyword') || '';
  const sortParam = searchParams.get('sort') === 'asc';
  const regionCodeParam = searchParams.get('region') || '';
  const kindFilterParam = getAnimalKind(searchParams.get('kind'));
  const sexFilterParam = getSexFilter(searchParams.get('sex'));
  const statusFilterParam = getStatusFilter(searchParams.get('status'));
  const likedParam = searchParams.get('liked') === 'true';

  const [currentPage, setCurrentPage] = useState(pageParam);
  const [searchKeyword, setSearchKeyword] = useState(keywordParam);
  const [dateSort, setDateSort] = useState(sortParam);
  const [regionCode, setRegionCode] = useState(regionCodeParam);
  const [kindFilter, setKindFilter] = useState<AnimalKind>(kindFilterParam);
  const [sexFilter, setSexFilter] = useState<SexFilterValue>(sexFilterParam);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(statusFilterParam);
  const [showOnlyLiked, setShowOnlyLiked] = useState(likedParam);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPets = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const data = await fetchPetPosts(controller.signal, 30);
        setPosts(parsePetPostsResponse(data));
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('펫 데이터 오류', e);
        setLoadError('펫 데이터를 불러오지 못했어요.');
        showToast({ message: '펫 데이터를 불러오지 못했어요.', type: 'error' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchPets();
    return () => controller.abort();
  }, [showToast, retryCount]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRegions = async () => {
      try {
        const data = await fetchPetRegions(controller.signal);
        setRegionOptions(parseRegionOptionsResponse(data));
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        showToast({ message: '지역 정보를 불러오지 못했어요.', type: 'error' });
      }
    };

    void fetchRegions();
    return () => controller.abort();
  }, [showToast, retryCount]);

  useEffect(() => {
    let active = true;

    const fetchLikedPosts = async () => {
      if (!userUid) {
        setLikedIds([]);
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'pet'));
        const result: string[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (Array.isArray(data.likedUsers) && data.likedUsers.includes(userUid)) {
            result.push(docSnap.id); // 문서 ID = desertionNo
          }
        });

        if (active) setLikedIds(result);
      } catch (err) {
        if (active) {
          console.error('좋아요 불러오기 실패', err);
          showToast({ message: '좋아요 정보를 불러오지 못했어요.', type: 'error' });
        }
      }
    };

    void fetchLikedPosts();
    return () => {
      active = false;
    };
  }, [userUid, showToast]);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    if (regionCode) {
      filtered = filtered.filter((p) => p.orgNm?.startsWith(regionCode));
    }

    filtered = filtered
      .sort((a, b) =>
        dateSort
          ? Number(a.noticeSdt) - Number(b.noticeEdt)
          : Number(b.noticeEdt) - Number(a.noticeSdt)
      )
      .filter((post) => {
        // 종 필터 적용
        const kind = post.upKindCd || '';
        if (kindFilter === 'dog') return kind === '417000';
        if (kindFilter === 'cat') return kind === '422400';
        if (kindFilter === 'etc') return kind !== '417000' && kind !== '422400';
        return true;
      })
      .filter((post) => !sexFilter || post.sexCd === sexFilter)
      .filter((post) => !statusFilter || post.processState === statusFilter)
      .filter(
        (post) =>
          (post.kindNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (post.colorCd || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (post.careNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (post.orgNm || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (post.processState || '').toLowerCase().includes(searchKeyword.toLowerCase())
      )
      .filter((post) => !showOnlyLiked || likedIds.includes(post.desertionNo?.toString()));

    const uniqueMap = new Map<string, PetPost>();
    filtered.forEach((post) => uniqueMap.set(post.desertionNo, post));
    return Array.from(uniqueMap.values());
  }, [
    posts,
    searchKeyword,
    dateSort,
    regionCode,
    kindFilter,
    sexFilter,
    statusFilter,
    showOnlyLiked,
    likedIds,
  ]);

  const itemsPerPage = 12;
  const totalPages = getTotalPages(filteredPosts.length, itemsPerPage);
  const safeCurrentPage = totalPages > 0
    ? Math.min(Math.max(currentPage, 1), totalPages)
    : 1;
  const currentItems = getCurrentPageItems(filteredPosts, safeCurrentPage, itemsPerPage);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const pageFromParams = Number.parseInt(searchParams.get('page') ?? '', 10);
    const keywordFromParams = searchParams.get('keyword') || '';
    const sortFromParams = searchParams.get('sort') === 'asc';

    setCurrentPage(!isNaN(pageFromParams) ? pageFromParams : 1);
    setSearchKeyword(keywordFromParams);
    setDateSort(sortFromParams);
    setRegionCode(searchParams.get('region') || '');
    setKindFilter(getAnimalKind(searchParams.get('kind')));
    setSexFilter(getSexFilter(searchParams.get('sex')));
    setStatusFilter(getStatusFilter(searchParams.get('status')));
    setShowOnlyLiked(searchParams.get('liked') === 'true');
  }, [searchParams]);

  useEffect(() => {
    const pageFromQuery = searchParams.get('page');
    const isFilterChanged = [
      searchKeyword,
      dateSort,
      regionCode,
      kindFilter,
      sexFilter,
      statusFilter,
      showOnlyLiked,
    ];

    // 필터 바뀌었고, page 쿼리도 없음 → 리셋
    if (!pageFromQuery && isFilterChanged.some((v) => v)) {
      setCurrentPage(1);
    }
  }, [
    searchKeyword,
    dateSort,
    regionCode,
    kindFilter,
    sexFilter,
    statusFilter,
    showOnlyLiked,
    searchParams,
  ]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    newParams.set('page', currentPage.toString());
    newParams.set('keyword', searchKeyword);
    newParams.set('sort', dateSort ? 'asc' : 'desc');
    if (regionCode) newParams.set('region', regionCode);
    if (kindFilter !== 'all') newParams.set('kind', kindFilter);
    if (sexFilter) newParams.set('sex', sexFilter);
    if (statusFilter) newParams.set('status', statusFilter);
    if (showOnlyLiked) newParams.set('liked', 'true');

    setSearchParams(newParams, { replace: false });
  }, [
    currentPage,
    searchKeyword,
    dateSort,
    regionCode,
    kindFilter,
    sexFilter,
    statusFilter,
    showOnlyLiked,
    setSearchParams,
  ]);

  useEffect(() => {
    if (loading) {
      showToast({
        message: '리스트를 불러오는 중입니다.',
        type: 'info',
      });
    }
  }, [loading, showToast]);

  if (loading) {
    return (
      <div className="max-w-[85rem] mx-auto mb-8 px-4 py-10">
        <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
          보호동물
        </h2>
        <PetPostListSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[85rem] mx-auto mb-8 px-4 py-10 text-center" role="alert">
        <p>{loadError}</p>
        <button
          type="button"
          className="inline-flex gap-2 items-center mt-4 text-primary"
          onClick={() => setRetryCount((count) => count + 1)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] mx-auto mb-8 px-4 py-10">
      <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
        보호동물
      </h2>
      <PetSearchBar
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        filter={kindFilter}
        setFilter={setKindFilter}
        regionCode={regionCode}
        setRegionCode={setRegionCode}
        regionOptions={regionOptions}
        sexFilter={sexFilter}
        setSexFilter={setSexFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showOnlyLiked={showOnlyLiked}
        setShowOnlyLiked={setShowOnlyLiked}
      />
      <SortButtonGroup
        posts={posts}
        dateSort={dateSort}
        setDateSort={setDateSort}
      />
      <PetPostList
        filteredPosts={currentItems}
        searchKeyword={searchKeyword}
        currentPage={safeCurrentPage}
        dateSort={dateSort}
      />
      {filteredPosts.length === 0 && (
        <p className="mt-8 text-center text-gray-500">조건에 맞는 보호동물이 없습니다.</p>
      )}
      {totalPages > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
