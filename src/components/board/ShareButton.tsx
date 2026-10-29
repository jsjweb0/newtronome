import { useId, useState } from 'react';
import { Link as LinkIcon, Share } from 'lucide-react';
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
        className="flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-800 focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
        aria-expanded={showCopy && !closing}
        aria-controls={panelId}
        aria-label="Dropdown"
        onClick={toggleCopyBox}
      >
        <Share className="shrink-0 size-4" />
        Share
      </button>
      {(showCopy || closing) && (
        <div
          className={`transform absolute top-8 max-lg:right-0 z-10 w-52 bg-gray-900 shadow-md rounded-xl p-2 text-sm md:text-base dark:border dark:border-neutral-800 dark:bg-neutral-950 ${closing ? 'animate-fade-slide-out' : 'animate-fade-slide-in'}`}
          id={panelId}
          aria-labelledby={buttonId}
        >
          <button
            type="button"
            className="flex items-center gap-x-3.5 w-full py-2 px-3 rounded-lg text-sm text-gray-400 hover:bg-white/10 focus:bg-white/10 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900"
            onClick={handleCopy}
          >
            <LinkIcon className="shrink-0 size-4" />
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
