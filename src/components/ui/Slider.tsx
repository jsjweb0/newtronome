import { useRef, useState } from 'react';
import Slider, { type Settings } from 'react-slick';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ImageSliderProps {
  images?: readonly string[];
  alt?: string;
  className?: string;
}

export default function ImageSlider({
  images = [],
  alt = '',
  className = '',
}: ImageSliderProps) {
  const sliderRef = useRef<Slider | null>(null);
  const [isAutoplaying, setIsAutoplaying] = useState(true);

  const hasMultipleImages = images.length > 1;

  const handleAutoplayToggle = () => {
    if (isAutoplaying) {
      sliderRef.current?.slickPause();
    } else {
      sliderRef.current?.slickPlay();
    }

    setIsAutoplaying((current) => !current);
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const counterLength = String(images.length).length;
  const currentSlideNumber = String(Math.min(currentSlide + 1, images.length)).padStart(
    counterLength,
    '0'
  );
  const totalSlideNumber = String(images.length).padStart(counterLength, '0');

  const settings: Settings = {
    fade: true,
    dots: false,
    infinite: hasMultipleImages,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: hasMultipleImages,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
    afterChange: setCurrentSlide,
  };

  return (
    <div className={`relative w-full h-auto overflow-hidden ${className}`}>
      <Slider ref={sliderRef} {...settings}>
        {images.map((src, idx) => (
          <div key={idx} title={`${idx + 1}번째 슬라이드입니다.`}>
            <img
              src={src}
              alt={alt ? `${alt} 사진 ${idx + 1}` : ''}
              className="w-full h-auto object-contain rounded-xl shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://picsum.photos/seed/fallback-${idx}/1000/800`;
              }}
            />
          </div>
        ))}
      </Slider>
      {hasMultipleImages && (
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => sliderRef.current?.slickPrev()}
            aria-label="이전 이미지"
            className="p-1.5 rounded-full bg-black/55 text-white"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleAutoplayToggle}
            aria-label={
              isAutoplaying
                ? '슬라이드 자동 재생 일시정지'
                : '슬라이드 자동 재생 시작'
            }
            className="p-1.5 rounded-full bg-black/55 text-white"
          >
            {isAutoplaying ? (
              <Pause aria-hidden="true" className="size-4" />
            ) : (
              <Play aria-hidden="true" className="size-4" />
            )}
          </button>

          <span
            className="px-2 py-1 rounded-full bg-black/55 text-[10px] text-white"
            aria-live="polite"
          >
            {currentSlideNumber} / {totalSlideNumber}
          </span>

          <button
            type="button"
            onClick={() => sliderRef.current?.slickNext()}
            aria-label="다음 이미지"
            className="p-1.5 rounded-full bg-black/55 text-white"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
