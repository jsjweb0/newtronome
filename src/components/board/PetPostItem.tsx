import dayjs from "dayjs";
import { Link } from "react-router-dom";
import noImage from "../../assets/no-image.webp";
import ShareButton from "./ShareButton";
import LikeButton from '../ui/LikeButton';

export interface PetPost {
    desertionNo: string;
    noticeSdt?: string;
    noticeEdt?: string;
    popfile1?: string;
    kindNm?: string;
    colorCd?: string;
    careNm?: string;
    processState?: string;
    upKindNm?: string;
    orgNm?: string;
    sexCd?: string;
    likeCount?: number;
}

type PetPostItemProps = {
    post: PetPost;
    searchKeyword: string;
    currentPage: number;
    dateSort: boolean;
}

function PetPostItem({ post, searchKeyword, currentPage, dateSort }: PetPostItemProps) {
    const highlightText = (
        text: string | undefined,
        keyword: string
    ) => {
        const safeText = text ?? '';

        if (!keyword) return safeText;

        const regex = new RegExp(`(${keyword})`, 'gi');

        return safeText.split(regex).map((part, index) =>
            part.toLowerCase() === keyword.toLowerCase() ? (
                <mark key={index}>{part}</mark>
            ) : (
                part
            )
        );
    };

    const endDate = post.noticeEdt ? dayjs(post.noticeEdt) : null;

    const dayLeft =
        endDate?.isValid()
            ? endDate.diff(dayjs(), 'day')
            : null;

    const deadlineLabel =
        dayLeft === null
            ? '날짜 미정'
            : dayLeft > 0
                ? `${dayLeft}일`
                : dayLeft === 0
                    ? '오늘 마감'
                    : '마감됨';

    return (
        <li key={post.desertionNo}
            className="relative mb-0 md:mb-4">
            <Link
                to={`/board/pet/${post.desertionNo}?page=${currentPage}&keyword=${searchKeyword}&sort=${dateSort ? 'asc' : 'desc'}`}
                className="overflow-hidden group flex flex-col"
                state={{
                    page: currentPage, sort: dateSort, keyword: searchKeyword
                }}
            >
                <div
                    className="aspect-3/2 overflow-hidden bg-gray-100 rounded-2xl dark:bg-neutral-800">
                    <img
                        src={post.popfile1 || noImage}
                        onError={(event) => {
                            event.currentTarget.src = noImage;
                            event.currentTarget.onerror = null;
                        }}
                        alt={`${post.kindNm ?? '보호동물'} 사진`}
                        className="object-cover w-full h-full rounded-2xl"
                    />
                </div>
                <div className="pt-4">
                    <h3 className="font-semibold md:text-lg text-black dark:text-white">
                        {searchKeyword ? (
                            <i className="not-italic">
                                [
                                {highlightText(post.kindNm, searchKeyword)}
                                ]{" "}
                                {highlightText(post.colorCd, searchKeyword)}
                            </i>
                        )
                            : (
                                <>
                                    <span
                                        className="overflow-hidden relative inline-block max-w-full whitespace-nowrap text-ellipsis before:absolute before:bottom-0.5 before:start-0 before:-z-1 before:w-full before:h-1 before:bg-blue-400 before:transition before:origin-left before:scale-x-0 group-hover:before:scale-x-100 ">
                                        {`[${post.kindNm}] ${post.colorCd}`}
                                    </span>
                                </>

                            )
                        }
                    </h3>
                    <p className="flex mt-1 text-sm md:text-base text-gray-600 dark:text-neutral-500">
                        <span className="inline-block mr-1.5">공고기간</span>
                        {post.noticeSdt
                            ? dayjs(post.noticeSdt).format('YYYY-MM-DD')
                            : '날짜 미정'}
                        {' ~ '}
                        {post.noticeEdt
                            ? dayjs(post.noticeEdt).format('YYYY-MM-DD')
                            : '날짜 미정'}
                        <span className="inline-flex items-center gap-x-1.5 ml-1.5 py-1 px-2 rounded-full text-xs font-medium bg-blue-600 text-white dark:bg-blue-500">
                            {deadlineLabel}
                        </span>
                    </p>
                    <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-neutral-500">{highlightText(post.careNm, searchKeyword)}</p>
                    <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-neutral-500">{post.processState}</p>
                    <div className="mt-3 text-sm md:text-base flex flex-wrap gap-2">
                        <span
                            className="py-1.5 px-3 bg-white text-gray-600 border border-gray-200 text-xs sm:text-sm rounded-2xl dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
                            {highlightText(post.upKindNm, searchKeyword)}
                        </span>
                        <span
                            className="py-1.5 px-3 bg-white text-gray-600 border border-gray-200 text-xs sm:text-sm rounded-2xl dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
                            {highlightText(post.orgNm, searchKeyword)}
                        </span>
                        <span
                            className="py-1.5 px-3 bg-white text-gray-600 border border-gray-200 text-xs sm:text-sm rounded-2xl dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
                            {post.sexCd === "M" ? "수컷" : post.sexCd === "F" ? "암컷" : "미상"}
                        </span>
                    </div>
                </div>
            </Link>
            <div className="absolute top-2.5 right-2.5">
                <LikeButton
                    docId={post.desertionNo}
                    collection="pet"
                    showCount={false}
                />
            </div>
            <ShareButton
                className="!absolute bottom-11 right-3 z-20"
                url={`${window.location.origin}/board/pet/${post.desertionNo}`}
                post={post}
            />
        </li>
    )
}

export default PetPostItem;
