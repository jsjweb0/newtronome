import {useState} from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function ImageSlider({images = [], alt = '', className}) {
    const [currentSlide, setCurrentSlide] = useState(1);

    const settings = {
        fade: true,
        dots: true,
        infinite: true,
        speed: 400,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000,
        afterChange: (index) => setCurrentSlide(index + 1),
        appendDots: dots => (
            <ul>{dots}</ul>
        ),
        customPaging: i => (
            <button title={`${i + 1}번째 슬라이드로 이동`}/>
        )
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
        </div>
    )
}