import { useId, useState } from 'react';
import { Link as LinkIcon, Share2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

type ShareButtonProps = {
  url?: string;
  className?: string;
};

export default function ShareButton({ url, className = '' }: ShareButtonProps) {
  const { showToast } = useToast();
  const [showCopy, setShowCopy] = useState(false);
  const [closing, setClosing] = useState(false);
  const buttonId = useId();
  const panelId = useId();

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
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      showToast({ message: '링크가 복사되었습니다!', type: 'success' });
      toggleCopyBox();
    } catch {
      showToast({ message: '복사에 실패했습니다.', type: 'error' });
    }
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        id={buttonId}
        className="inline-flex items-center gap-2 min-h-11 px-4.5 rounded-full border border-textThr text-sm font-bold text-textBase hover:bg-field focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={showCopy && !closing}
        aria-controls={panelId}
        onClick={toggleCopyBox}
      >
        <Share2 aria-hidden="true" className="shrink-0 size-4" />
        공유
      </button>
      {(showCopy || closing) && (
        <div
          className={`transform absolute bottom-13 right-0 z-10 w-52 p-1.5 rounded-xl border border-textThr bg-background shadow-lg text-sm dark:bg-field ${closing ? 'animate-fade-slide-out' : 'animate-fade-slide-in'}`}
          id={panelId}
          aria-labelledby={buttonId}
        >
          <button
            type="button"
            className="flex items-center gap-x-2.5 w-full min-h-10 px-3 rounded-lg text-sm text-textBase hover:bg-textThr/60 focus-visible:bg-textThr/60"
            onClick={handleCopy}
          >
            <LinkIcon aria-hidden="true" className="shrink-0 size-4" />
            링크 복사
          </button>
        </div>
      )}
    </div>
  );
}
