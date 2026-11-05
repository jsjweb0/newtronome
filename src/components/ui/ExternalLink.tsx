import type { AnchorHTMLAttributes, ReactNode } from 'react';

type ExternalLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'target' | 'rel' | 'aria-label'
> & {
  href: string;
  /** 스크린리더용 링크 이름. "(새 창)"은 자동으로 붙는다 */
  label: string;
  children: ReactNode;
};

/**
 * 외부 사이트(SoundCloud 등)로 나가는 링크.
 * 항상 새 창으로 열고, 접근성 이름에 "(새 창)"을 붙인다.
 */
export default function ExternalLink({ label, children, ...anchorProps }: ExternalLinkProps) {
  return (
    <a
      {...anchorProps}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (새 창)`}
    >
      {children}
    </a>
  );
}
