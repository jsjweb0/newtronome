import { Fragment } from 'react';
import { BaseButton } from '../ui/BaseButton';
import {
  FREE_BOARD_CATEGORIES,
  type FreeBoardCategoryValue,
} from '../../constants/freeBoardCategories';

export type CategoryFilterValue = FreeBoardCategoryValue | '';

type CategoryFilterProps = {
  selectedCategory: CategoryFilterValue;
  onCategoryChange: (category: CategoryFilterValue) => void;
};

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  return (
    <div
      className="peer category-filter flex flex-wrap items-center justify-center md:gap-2 gap-0.5 mt-6"
      role="group"
      aria-label="카테고리 필터"
    >
      <BaseButton
        type="button"
        variant={selectedCategory === '' ? 'link' : 'ghost'}
        aria-pressed={selectedCategory === ''}
        onClick={() => onCategoryChange('')}
        className="px-3! py-2! text-sm! max-md:text-xs!"
      >
        전체
      </BaseButton>

      {FREE_BOARD_CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.value;

        return (
          <Fragment key={category.value}>
            <span className="text-textThr" aria-hidden="true">|</span>
            <BaseButton
              type="button"
              variant={isSelected ? 'link' : 'ghost'}
              aria-pressed={isSelected}
              onClick={() => onCategoryChange(category.value)}
              className="px-3! py-2! text-sm! max-md:text-xs!"
            >
              {category.label}
            </BaseButton>
          </Fragment>
        );
      })}
    </div>
  );
}
