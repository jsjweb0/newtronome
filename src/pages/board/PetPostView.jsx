import dayjs from "dayjs";
import {useLocation, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Link} from "react-router-dom";
import {useToast} from "../../contexts/useToast.js";
import {useEffect, useState} from "react";
import {BaseButton} from "../../components/ui/BaseButton.jsx";
import {
    AlignJustify,
    Info,
    SquareArrowOutUpRight,
    PhoneOutgoing, MessageCircle
} from "lucide-react";
import ShareButton from "../../components/board/ShareButton.jsx";
import ImageSlider from "../../components/ui/Slider.jsx";
import PetPostViewSkeleton from "../../components/board/PetPostViewSkeleton.jsx";
import LikeButton from "../../components/ui/LikeButton.jsx";

export default function PetPostView() {
    const {id} = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const page = location.state?.page || parseInt(searchParams.get("page")) || 1;
    const keyword = location.state?.keyword || searchParams.get("keyword") || '';
    const sort = location.state?.sort || searchParams.get("sort") || 'desc';

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch('https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2?serviceKey=l7ngeStfaLO1QpNc4njFsAoLLALk//VGMTfhTwFidxSvqRMd4YLHKsp2u28o5zpEPlYjmr5y5UOpSt4xphNqkA==&pageNo=1&numOfRows=100&_type=json');
                const data = await res.json();
                const items = data.response?.body?.items?.item || [];
                const found = items.find((item) => item.desertionNo === id);

                if (found) {
                    setPost(found);
                    showToast({message: "게시글을 불러오는 중입니다.", type: "info"});
                } else {
                    showToast({message: "해당 게시글을 찾을 수 없습니다.", type: "error"});
                }
            } catch (e) {
                console.error(e);
                showToast({message: "API 호출 오류입니다.", type: "error"});
            } finally {
                setLoading(false); // 로딩 끝
            }
        };

        fetchPost();
    }, [id]);

    if (loading) {
        return <PetPostViewSkeleton />;
    }

    if (!post) {
        return <div className="mt-20 text-center font-semibold">존재하지 않는 게시글입니다.</div>;
    }

    const endDate = dayjs(post.noticeEdt);
    const today = dayjs();
    const dayLeft = endDate.diff(today, 'day');
    const images = [post.popfile1, post.popfile2].filter(Boolean);
    const orgNm = post.orgNm?.split(' ').slice(0, 2).join(' ');

    return (
        <div className="max-w-[85rem] mx-auto px-4">
            <div
                className="px-4 py-4 border-y border-gray-300 text-center">
                <h4 className="font-semibold text-md md:text-2xl">{`[${post.kindNm}] ${post.colorCd}`}</h4>
                <div className="flex flex-wrap justify-center gap-2 text-xs md:text-sm text-white mt-4">
                    <span
                        className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {post.kindNm}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {post.sexCd === "M" ? "수컷" : post.sexCd === "F" ? "암컷" : "미상"}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {post.colorCd}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {orgNm}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {post.processState}
                    </span>
                </div>
            </div>
            <div className="py-5 px-3 md:py-12 md:px-7 border-b border-gray-300">
                <div
                    className="bg-white border border-gray-200 rounded-lg shadow-lg mb-8 p-5 dark:bg-neutral-800 dark:border-neutral-700">
                    <div className="flex">
                        <div className="shrink-0">
                            <Info className="shrink-0 size-4 text-blue-600 mt-0.5"/>
                        </div>
                        <div className="ms-2.5">
                            <p className="text-xs md:text-sm text-gray-700 dark:text-neutral-400">
                                이 정보는 <Link
                                className="font-bold decoration-2 hover:underline focus:outline-hidden focus:underline dark:text-white"
                                to={`https://www.qia.go.kr/listindexWebAction.do`}
                                target="_blank" title="새 창 열림"
                            >농림축산식품부 농림축산검역본부</Link> 에서 제공하는 국가동물보호정보시스템 구조동물 조회 서비스로 직접 수정/삭제할 수 없습니다.
                            </p>
                        </div>
                    </div>
                </div>
                {/* 내용 */}
                <div>
                    <ImageSlider images={images} alt={post?.kindNm || '동물' + post?.colorCd || ''}/>
                    <div className="mt-8 text-center">
                        <BaseButton as="link"
                                    to={`tel:${post.careTel}`}
                                    className="!px-6 !text-sm">📞 입양 문의하기</BaseButton>
                    </div>
                    <div className="flex flex-col mt-8 md:mt-12">
                        <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">📍 동물 정보</h2>
                        <div className="p-1.5 -m-1.5 overflow-x-auto">
                            <div
                                className="min-w-full inline-block align-middle border border-gray-200 rounded-lg shadow-xs overflow-hidden dark:border-neutral-700 dark:shadow-gray-900">
                                <table className="w-full divide-y divide-gray-200 text-left dark:divide-neutral-700">
                                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">공고번호</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.noticeNo}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">공고기간</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">
                                            {dayjs(post.noticeSdt).format("YYYY-MM-DD")} ~ {dayjs(post.noticeEdt).format("YYYY-MM-DD")}
                                            <span
                                                className="inline-flex items-center gap-x-1.5 ml-2 py-1 px-2 rounded-full text-xs font-medium bg-blue-600 text-white dark:bg-blue-500">{dayLeft > 0 ? dayLeft : dayLeft === 0 ? '오늘 마감' : '마감됨'}일</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">동물등록번호</td>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.rfidCd}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">동물종류</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.upKindNm}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">품종</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.kindNm}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">나이
                                            / 몸무게
                                        </th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.age} / {post.weight}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">털색</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.colorCd}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">성별</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.sexCd === "M" ? "수컷" : post.sexCd === "F" ? "암컷" : "미상"}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">중성화
                                            여부
                                        </th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.neuterYn === "Y" ? "예" : post.sexCd === "N" ? "아니오" : "미상"}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">특징</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.specialMark}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col mt-12">
                        <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">📍 구조 정보</h2>
                        <div className="p-1.5 -m-1.5 overflow-x-auto">
                            <div
                                className="min-w-full inline-block align-middle border border-gray-200 rounded-lg shadow-xs overflow-hidden dark:border-neutral-700 dark:shadow-gray-900">
                                <table className="w-full divide-y divide-gray-200 text-left dark:divide-neutral-700">
                                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">구조일</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.updTm}</td>
                                    </tr>
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">구조장소</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.happenPlace}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <p className="flex items-center gap-1 text-sm italic text-gray-400 mt-3"><Info
                            className="shrink-0 size-4"/>유기동물 문의는 보호센터에 연락하시기 바랍니다.</p>
                    </div>
                    <div className="flex flex-col mt-12">
                        <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">📍 보호소 정보</h2>
                        <div className="p-1.5 -m-1.5 overflow-x-auto">
                            <div
                                className="min-w-full inline-block align-middle border border-gray-200 rounded-lg shadow-xs overflow-hidden dark:border-neutral-700 dark:shadow-gray-900">
                                <table className="w-full divide-y divide-gray-200 text-left dark:divide-neutral-700">
                                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">보호센터</th>
                                        <td className="px-3 md:px-6 py-4 text-sm text-gray-800 dark:text-neutral-200">{post.careNm}</td>
                                    </tr>

                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">주소</th>
                                        <td className="px-3 md:px-6 py-4 break-keep text-sm text-gray-800 dark:text-neutral-200">
                                            {post.careAddr}
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.careAddr)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex md:inline-flex items-center gap-x-1 md:ml-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 focus:outline-hidden focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
                                            >
                                                구글맵 바로가기
                                                <SquareArrowOutUpRight
                                                    className="shrink-0 size-4 mt-1 group-hover:text-blue-800 dark:group-hover:text-blue-400"/>
                                            </a>
                                        </td>
                                    </tr>

                                    <tr>
                                        <th className="w-20 md:w-40 px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-neutral-400">전화번호</th>
                                        <td className="px-3 md:px-6 py-4 text-sm font-medium">
                                            <a
                                                href={`tel:${post.careTel}`}
                                                className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 focus:outline-hidden focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
                                            >
                                                <PhoneOutgoing
                                                    className="shrink-0 size-4 mt-1 group-hover:text-blue-800 dark:group-hover:text-blue-400"/>
                                                {post.careTel}
                                            </a>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 sticky bottom-6 inset-x-0 text-center">
                    <div className="inline-block bg-white shadow-md rounded-full py-3 px-4 dark:bg-neutral-800">
                        <div className="flex items-center gap-x-1.5">
                            <Link to={`tel:${post.careTel}`}
                                  className="inline-block py-1 pl-2 pr-1 text-sm font-medium text-gray-600 rounded-md hover:bg-black/10 focus:bg-black/10 dark:text-neutral-300 dark:hover:bg-white/10 dark:focus:bg-white/10">📞
                                입양 문의하기</Link>
                            <div
                                className="block h-3 border-e border-gray-300 mx-2 md:mx-3 dark:border-neutral-600"></div>
                            <LikeButton docId={post.desertionNo}
                                        collection="pet"
                                        initialCount={post.likeCount}/>
                            <div
                                className="block h-3 border-e border-gray-300 mx-2 md:mx-3 dark:border-neutral-600"></div>
                            <ShareButton post={post} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center mt-6 md:mt-9 max-md:justify-center">
                <div className="shrink-0 inline-flex">
                    <ul>
                        <li>
                            <BaseButton
                                onClick={() => {
                                    const query = new URLSearchParams();

                                    query.set("page", page?.toString() || "1");
                                    if (keyword) query.set("keyword", keyword);
                                    if (sort) query.set("sort", sort);

                                    navigate({
                                        pathname: "/board/pet",
                                        search: `?${query.toString()}`,
                                    });
                                }}
                                variant="outline"
                            >
                                <AlignJustify
                                    className="shrink-0 size-4 text-gray-600 group-hover:text-blue-600 dark:text-white/60"
                                />
                                목록
                            </BaseButton>

                        </li>
                    </ul>
                </div>
            </div>


        </div>
    );
}