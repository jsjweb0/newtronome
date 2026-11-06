import clsx from 'clsx';
import {
  FREE_BOARD_CATEGORIES,
  type FreeBoardCategoryValue,
} from '../../constants/freeBoardCategories';

export type CategoryFilterValue = FreeBoardCategoryValue | '';

type CategoryFilterProps = {
  selectedCategory: CategoryFilterValue;
  onCategoryChange: (category: CategoryFilterValue) => void;
};

const options: { value: CategoryFilterValue; label: string }[] = [
  { value: '', label: '전체' },
  ...FREE_BOARD_CATEGORIES,
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-1.5 max-md:w-full max-md:overflow-x-auto max-md:[scrollbar-width:none] md:flex-wrap"
      role="group"
      aria-label="카테고리 필터"
    >
      {options.map((category) => {
        const isSelected = selectedCategory === category.value;

        return (
          <button
            key={category.value || 'all'}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onCategoryChange(category.value)}
            className={clsx(
              'shrink-0 min-h-11 md:min-h-9.5 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isSelected
                ? 'border-primary bg-primary text-onPrimary'
                : 'border-textThr text-textSub hover:text-textBase hover:bg-field'
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
