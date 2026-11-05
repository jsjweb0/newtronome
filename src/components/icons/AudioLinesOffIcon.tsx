import type { SVGProps } from 'react';

export default function AudioLinesOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-audio-lines-off preview-icon"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 10v11" />
      <path d="M10 3v1.35" />
      <path d="M14 14v1" />
      <path d="M14 8v.35" />
      <path d="M18 5v7.35" />
      <path d="M2 10v3" />
      <path d="m2 2 20 20" />
      <path d="M22 10v3" />
      <path d="M6 6v11" />
    </svg>
  );
}