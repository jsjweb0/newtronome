import React from "react";
import "./AudioEqualizerIcon.css";

export default function AudioEqualizerIcon({ isPlaying = false, size = 24, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`lucide lucide-audio-lines ${isPlaying ? "animate" : "paused"} ${className}`}
        >
            <path className="bar bar1" d="M2 10v3" />
            <path className="bar bar2" d="M6 6v11" />
            <path className="bar bar3" d="M10 3v18" />
            <path className="bar bar4" d="M14 8v7" />
            <path className="bar bar5" d="M18 5v13" />
            <path className="bar bar6" d="M22 10v3" />
        </svg>
    );
}