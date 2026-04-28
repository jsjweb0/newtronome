import {useEffect, useState} from "react";
import {useToast} from "../../contexts/ToastContext.jsx";
import {Link as LinkIcon, Share} from "lucide-react";
import noImage from "../../assets/no-image.webp";

/**
 * @param {string} url - 복사할 링크 (없으면 현재 페이지 URL 사용)
 */
export default function ShareButton({url, className = "", post}) {
    const { showToast } = useToast();
    const [showCopy, setShowCopy] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init("a1800562b80744b33ad9e4b5649d882a");
        }
    }, []);

    const toggleCopyBox = () => {
        if (showCopy) {
            setClosing(true);
            setTimeout(() => {
                setShowCopy(false);
                setClosing(false);
            }, 150);
        } else {
            setShowCopy(true);
        }
    }

    const handleCopy = async () => {
        const copyUrl = url || window.location.href;

        try {
            await navigator.clipboard.writeText(copyUrl);
            showToast({message: "링크가 복사되었습니다!", type: "success"});
            toggleCopyBox();
        } catch (err) {
            showToast({message: "복사에 실패했습니다.", type: "error"});
        }
    }

    const shareToKakao = () => {
        if (!window.Kakao) return;

        window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '[보호동물] ' + post.kindNm,
                description: post.colorCd + ' / ' + post.careNm,
                imageUrl: post.popfile1 || noImage,
                link: {
                    mobileWebUrl: `https://너도메인.com/board/pet/${post.desertionNo}`,
                    webUrl: `https://너도메인.com/board/pet/${post.desertionNo}`,
                },
            },
            buttons: [
                {
                    title: '보러가기',
                    link: {
                        mobileWebUrl: `https://너도메인.com/board/pet/${post.desertionNo}`,
                        webUrl: `https://너도메인.com/board/pet/${post.desertionNo}`,
                    },
                },
            ],
        });
    };


    return (
        <div className={`relative inline-flex ${className}`}>
            <button type="button" id="shareDropdown"
                    className="flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                    aria-expanded={!showCopy ? "false" : "true"}
                    aria-label="Dropdown"
                    onClick={toggleCopyBox}
            >
                <Share className="shrink-0 size-4"/>
                Share
            </button>
            {(showCopy || closing) && (
                <div
                    className={`transform absolute top-8 max-lg:right-0 z-10 w-52 bg-gray-900 shadow-md rounded-xl p-2 text-sm md:text-base dark:border dark:border-neutral-800 dark:bg-neutral-950
                        ${closing ? 'animate-fade-slide-out' : 'animate-fade-slide-in'}`}
                    aria-labelledby="shareDropdown">
                    <button type="button"
                            className="flex items-center gap-x-3.5 w-full py-2 px-3 rounded-lg text-sm text-gray-400 hover:bg-white/10 focus:outline-hidden focus:bg-white/10 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900"
                            onClick={handleCopy}
                    >
                        <LinkIcon className="shrink-0 size-4"/>
                        Copy link
                    </button>
                    <div className="border-t border-gray-600 my-2 dark:border-neutral-800"></div>
                    <button type="button" className="flex items-center gap-x-3.5 w-full py-2 px-3 rounded-lg text-sm text-gray-400 hover:bg-white/10 focus:outline-hidden focus:bg-white/10 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900"
                       onClick={shareToKakao}>
                        <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                             fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"></path>
                        </svg>
                        Share on Kakao
                    </button>
                </div>
            )}
        </div>
    )
}