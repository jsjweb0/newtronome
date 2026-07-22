import { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function ImageSlider({ images = [], alt = '', className }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const counterLength = String(images.length).length;
    const currentSlideNumber = String(Math.min(currentSlide + 1, images.length)).padStart(
        counterLength,
        '0'
    );
    const totalSlideNumber = String(images.length).padStart(counterLength, '0');

    const settings = {
        fade: true,
        dots: false,
        infinite: true,
        speed: 400,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000,
        afterChange: setCurrentSlide,
    };

    return (
        <div className={`relative w-full h-auto overflow-hidden ${className}`}>
            <Slider {...settings}>
                {images.map((src, idx) => (
                    <div key={idx} title={`${idx + 1}번째 슬라이드입니다.`}>
                        <img src={src}
                             alt={alt + (idx + 1)}
                             className="w-full h-auto object-contain rounded-xl shadow-md"
                             onError={(e) => {
                                 e.currentTarget.onerror = null;
                                 e.currentTarget.src = `https://picsum.photos/seed/fallback-${idx}/1000/800`;
                             }}
                        />
                    </div>
                ))}
            </Slider>
            {images.length > 1 && (
                <span
                    className="absolute right-3 bottom-3 px-2 py-1 rounded-full bg-black/45 backdrop-blur-sm text-[10px] font-inter tabular-nums tracking-wide text-white/80"
                    aria-hidden="true"
                >
                    {currentSlideNumber} / {totalSlideNumber}
                </span>
            )}
        </div>
    )
}
