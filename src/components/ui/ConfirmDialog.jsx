import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { X as CloseIcon } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  labelledby = 'dialogLabelledby',
  title,
  message,
  onConfirm,
  onDismiss,
}) {
  return (
    <Dialog open={isOpen} onClose={onDismiss} className="relative z-999">
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel className="flex justify-center items-center w-full max-w-xs md:max-w-md p-0 bg-transparent">
          <div className="grow ease-out transition-all shadow-lg">
            <div className="relative flex flex-col bg-background rounded-xl">
              <div className="absolute top-2 bottom-2">
                <button
                  type="button"
                  onClick={onDismiss}
                  className={clsx(
                    'size-7 md:size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800',
                    'hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none',
                    'dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600'
                  )}
                  aria-label="Close"
                >
                  <span className="sr-only">닫기</span>
                  <CloseIcon className="size-4 md:size-5" />
                </button>
              </div>

              <div className="p-8 md:p-14 text-center overflow-y-auto">
                <DialogTitle
                  id={labelledby}
                  className="mb-2 font-bold text-gray-800 dark:text-neutral-200 text-base md:text-xl"
                >
                  {title}
                </DialogTitle>

                <p className="text-textSub max-md:text-sm">{message}</p>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={onDismiss}
                  className={clsx(
                    'w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-es-xl border border-transparent bg-gray-100 text-gray-800 max-md:text-xs',
                    'hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none',
                    'dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:hover:text-white dark:focus:text-white'
                  )}
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className={clsx(
                    'w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-ee-xl border border-transparent bg-primary text-white',
                    'max-md:text-xs',
                    'hover:bg-[#ef688a] focus:outline-hidden focus:bg-[#ef688a] disabled:opacity-50 disabled:pointer-events-none',
                    'dark:bg-primary/65 dark:hover:bg-primary/80 dark:focus:bg-primary/80'
                  )}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}