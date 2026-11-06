import { useState } from 'react';
import clsx from 'clsx';

type AvatarProps = {
  name: string;
  photoURL?: string | null;
  className?: string;
};

/**
 * 작성자 아바타. 이름이 바로 옆에 함께 표시되므로 스크린 리더에서는 숨긴다.
 * 사진이 없거나 불러오지 못하면 이름 첫 글자를 보여준다.
 */
export default function Avatar({ name, photoURL, className = 'size-7 text-xs' }: AvatarProps) {
  const [failedURL, setFailedURL] = useState<string | null>(null);
  const src = photoURL?.trim();
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?';

  if (src && failedURL !== src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setFailedURL(src)}
        className={clsx('shrink-0 rounded-full object-cover bg-field', className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'shrink-0 inline-flex items-center justify-center rounded-full bg-primary/15 font-extrabold text-primary',
        className,
      )}
    >
      {initial}
    </span>
  );
}
