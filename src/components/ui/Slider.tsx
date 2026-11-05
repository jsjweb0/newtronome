import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, EffectCoverflow, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

export interface SlideCaption {
  title: string;
  subtitle?: string;
}

interface ImageSliderProps {
  images?: readonly string[];
  /** images와 같은 순서의 슬라이드 설명 (가운데 커버 아래에 표시) */
  captions?: readonly SlideCaption[];
  alt?: string;
  className?: string;
  /** 가운데 슬라이드가 바뀔 때 (배경을 슬라이드에 맞출 때 사용) */
  onSlideChange?: (index: number) => void;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const AUTOPLAY_DELAY = 4000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

export default function ImageSlider({
  images = [],
  captions = [],
  alt = '',
  className = '',
  onSlideChange,
}: ImageSliderProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [isAutoplaying, setIsAutoplaying] = useState(() => !prefersReducedMotion());
  const [currentSlide, setCurrentSlide] = useState(0);

  const hasMultipleImages = images.length > 1;
  // loop는 양옆에 채울 슬라이드가 충분할 때만 (부족하면 끝에서 처음으로 되감기)
  const canLoop = images.length >= 5;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;

      swiperRef.current?.autoplay?.stop();
      setIsAutoplaying(false);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleAutoplayToggle = () => {
    const autoplay = swiperRef.current?.autoplay;

    if (isAutoplaying) {
      autoplay?.stop();
    } else {
      autoplay?.start();
    }

    setIsAutoplaying((current) => !current);
  };

  const counterLength = Math.max(2, String(images.length).length);
  const currentSlideNumber = String(Math.min(currentSlide + 1, images.length)).padStart(
    counterLength,
    '0'
  );
  const totalSlideNumber = String(images.length).padStart(counterLength, '0');
  const caption = captions[currentSlide];
  const progressPercent = images.length > 0 ? ((currentSlide + 1) / images.length) * 100 : 0;

  return (
    <div className={clsx('relative w-full', className)}>
      <div className="relative">
        <Swiper
          className="nt-coverflow"
          modules={[EffectCoverflow, Autoplay, A11y, Keyboard]}
          effect="coverflow"
          centeredSlides
          slidesPerView="auto"
          grabCursor
          loop={canLoop}
          rewind={!canLoop && hasMultipleImages}
          speed={500}
          keyboard={{ enabled: true, onlyInViewport: true }}
          coverflowEffect={{
            rotate: 28,
            // 양옆 카드를 작게 + 가운데 쪽으로 당겨서 컨테이너 밖으로 잘리지 않게
            stretch: '55%',
            depth: 180,
            scale: 0.78,
            modifier: 1,
            slideShadows: false,
          }}
          autoplay={
            hasMultipleImages
              ? { delay: AUTOPLAY_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
          }
          a11y={{
            prevSlideMessage: '이전 이미지',
            nextSlideMessage: '다음 이미지',
            slideLabelMessage: '{{index}}번째 슬라이드 (전체 {{slidesLength}}개)',
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            // 동작 줄이기 설정 사용자는 자동재생 없이 시작
            if (!isAutoplaying) swiper.autoplay?.stop();
          }}
          onSlideChange={(swiper) => {
            setCurrentSlide(swiper.realIndex);
            onSlideChange?.(swiper.realIndex);
          }}
        >
          {images.map((src, idx) => (
            <SwiperSlide key={idx} className="nt-coverflow-slide">
              <img
                src={src}
                alt={alt ? `${alt} 사진 ${idx + 1}` : ''}
                className="block w-full aspect-square object-cover rounded-[14px]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://picsum.photos/seed/fallback-${idx}/1000/1000`;
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="이전 이미지"
              className="absolute z-10 left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-11 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors"
            >
              <ChevronLeft aria-hidden="true" className="size-[22px]" />
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="다음 이미지"
              className="absolute z-10 right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-11 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors"
            >
              <ChevronRight aria-hidden="true" className="size-[22px]" />
            </button>
          </>
        )}
      </div>

      {caption && (
        <div className="mt-9 lg:mt-[110px] text-center">
          <p className="font-bold text-base lg:text-[17px] truncate">{caption.title}</p>
          {caption.subtitle && (
            <p className="mt-0.5 text-[13px] text-textSub truncate">{caption.subtitle}</p>
          )}
        </div>
      )}

      {hasMultipleImages && (
        <div className="flex items-center justify-center gap-x-3.5 mt-3">
          <button
            type="button"
            onClick={handleAutoplayToggle}
            aria-label={
              isAutoplaying
                ? '슬라이드 자동 재생 일시정지'
                : '슬라이드 자동 재생 시작'
            }
            aria-pressed={isAutoplaying}
            className="inline-flex items-center justify-center size-11 rounded-full bg-textSub/15 hover:bg-textSub/25 transition-colors"
          >
            {isAutoplaying ? (
              <Pause aria-hidden="true" className="size-4 fill-current" />
            ) : (
              <Play aria-hidden="true" className="size-4 fill-current" />
            )}
          </button>

          <span
            className="font-inter text-[13px] font-semibold tabular-nums"
            aria-live="polite"
          >
            {currentSlideNumber} / {totalSlideNumber}
          </span>

          {/* 진행 바: 곡 수가 많아도 한 줄을 유지 (위치는 카운터가 스크린리더에 알려줌) */}
          <div aria-hidden="true" className="relative h-1 w-24 sm:w-32 rounded-full bg-textSub/25 overflow-hidden">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
