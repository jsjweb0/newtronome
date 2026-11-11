import { House } from 'lucide-react';
import { Link } from 'react-router-dom';

/** 404의 줄무늬: NEWTRONOME 로고처럼 글자 아래쪽을 가로로 끊어 보이게 함 */
const stripeMask =
    'linear-gradient(180deg, #000 0 52%, transparent 52% 58%, #000 58% 70%, transparent 70% 75%, #000 75% 85%, transparent 85% 89%, #000 89%)';

export default function NotFoundPage() {
    return (
        <div className="relative isolate overflow-hidden flex flex-col items-center justify-center gap-4.5 h-full px-4 py-12 md:py-18 text-center text-textBase">
            <div
                aria-hidden="true"
                className="-z-10 absolute inset-0 bg-[radial-gradient(50%_55%_at_50%_40%,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_70%)]"
            />
            <span aria-hidden="true" className="absolute inset-x-0 top-[38%] h-px bg-primary/25" />
            <span aria-hidden="true" className="absolute inset-x-0 top-[calc(38%+6px)] h-px bg-primary/14" />

            <p className="font-inter text-xs font-extrabold tracking-[0.16em] text-primary">PAGE NOT FOUND</p>
            <h1
                className="font-inter italic font-black text-8xl md:text-[168px] leading-[0.9] tracking-[-0.04em] bg-linear-to-b from-primary/60 to-primary bg-clip-text text-transparent"
                style={{ maskImage: stripeMask, WebkitMaskImage: stripeMask }}
            >
                404
            </h1>
            <p className="text-base md:text-lg font-bold break-keep">죄송합니다. 요청하신 페이지를 찾을 수 없습니다.</p>
            <p className="-mt-2 text-[13px] text-textSub break-keep">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
            <Link
                to="/"
                className="mt-2 inline-flex items-center gap-2 min-h-12 px-5.5 rounded-full bg-primary text-onPrimary text-[15px] font-extrabold hover:bg-primary/85 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <House aria-hidden="true" className="size-4.5" />
                홈으로 돌아가기
            </Link>
        </div>
    );
}
